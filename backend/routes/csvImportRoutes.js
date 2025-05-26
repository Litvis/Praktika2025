import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized' });
};

const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
};

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  email = email.trim();
  
  if (email.length < 6 || email.length > 255) return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) return false;
  
  const [localPart] = email.split('@');
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  
  if (localPart.includes('..')) return false;
  
  const [, domain] = email.split('@');
  
  if (domain.startsWith('-') || domain.endsWith('-')) return false;
  
  const tld = domain.split('.').pop();
  if (tld.length < 2) return false;
  
  return true;
}

const setupTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_emails (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES email_groups(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, email)
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_group_emails_group_id ON group_emails(group_id);
    `);
    
    await client.query('COMMIT');
    console.log('Database tables set up successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

setupTables().catch(err => {
  console.error('Failed to set up tables:', err);
});

router.get('/api/groups-with-counts', requireAuth, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  try {
    const result = await pool.query(`
      SELECT g.id, g.name, g.description, g.created_at,
             COUNT(e.id) AS email_count
      FROM email_groups g
      LEFT JOIN group_emails e ON g.id = e.group_id
      GROUP BY g.id, g.name, g.description, g.created_at
      ORDER BY g.name ASC
    `);
    
    res.json({
      success: true,
      groups: result.rows
    });
  } catch (error) {
    console.error('Error fetching groups with counts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch groups' 
    });
  }
});

router.get('/api/groups', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, created_at FROM email_groups ORDER BY name'
    );
    
    res.json({
      success: true,
      groups: result.rows
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch groups' 
    });
  }
});

router.get('/api/groups/:id/emails', requireAuth, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  try {
    const groupId = req.params.id;
    
    const groupResult = await pool.query(
      'SELECT id, name FROM email_groups WHERE id = $1',
      [groupId]
    );
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Group not found' 
      });
    }
    
    const emailsResult = await pool.query(
      'SELECT email FROM group_emails WHERE group_id = $1 ORDER BY email',
      [groupId]
    );
    
    const emails = emailsResult.rows.map(row => row.email);
    
    res.json({
      success: true,
      group: groupResult.rows[0],
      emails: emails
    });
  } catch (error) {
    console.error(`Error fetching emails for group ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch group emails' 
    });
  }
});

router.post('/api/import-csv', requireAdmin, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  const client = await pool.connect();
  
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid data provided'
      });
    }
    
    await client.query('BEGIN');
    
    await client.query('DELETE FROM group_emails');
    await client.query('DELETE FROM email_groups');
    
    console.log('Cleared existing data');
    
    const stats = {
      groups: 0,
      emails: 0,
      invalidEmails: 0
    };
    
    const uniqueGroups = new Set();
    const groupNameToId = {};
    
    data.forEach(row => uniqueGroups.add(row.Group));
    
    for (const groupName of uniqueGroups) {
      const newGroup = await client.query(
        'INSERT INTO email_groups (name) VALUES ($1) RETURNING id',
        [groupName]
      );
      
      groupNameToId[groupName] = newGroup.rows[0].id;
      stats.groups++;
    }
    
    console.log(`Created ${stats.groups} new groups`);
    
    for (const row of data) {
      const email = row.Email ? row.Email.trim().toLowerCase() : '';
      if (!isValidEmail(email)) {
        stats.invalidEmails++;
        continue;
      }
      
      const groupId = groupNameToId[row.Group];
      
      try {
        await client.query(
          `INSERT INTO group_emails (group_id, email) 
           VALUES ($1, $2)
           ON CONFLICT (group_id, email) DO NOTHING`,
          [groupId, email]
        );
        
        stats.emails++;
      } catch (err) {
        console.error(`Error inserting email ${email}:`, err.message);
      }
    }
    
    console.log(`Added ${stats.emails} emails, skipped ${stats.invalidEmails} invalid emails`);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Data imported successfully (replaced all existing data)',
      stats: stats
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing CSV data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import data: ' + error.message 
    });
  } finally {
    client.release();
  }
});

export default router;