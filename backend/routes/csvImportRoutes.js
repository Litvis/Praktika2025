import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Middleware to check for authentication
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized' });
};

// Middleware to check for admin role
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
};

// Ensure necessary tables exist
const setupTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create the email_groups table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create the group_emails table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_emails (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES email_groups(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, email)
      );
    `);
    
    // Create index for faster lookups
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

// Set up tables when this module is loaded
setupTables().catch(err => {
  console.error('Failed to set up tables:', err);
});

// Get all groups with email counts
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

// Get all groups (without counts) - for dropdown selections
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

// Get emails for a specific group
router.get('/api/groups/:id/emails', requireAuth, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  try {
    const groupId = req.params.id;
    
    // First verify the group exists
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
    
    // Get all emails for this group
    const emailsResult = await pool.query(
      'SELECT email FROM group_emails WHERE group_id = $1 ORDER BY email',
      [groupId]
    );
    
    // Extract just the email addresses
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

// Import data from CSV (replacing all existing data)
router.post('/api/import-csv', requireAdmin, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  const client = await pool.connect();
  
  try {
    // Validate input
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid data provided'
      });
    }
    
    // Start a transaction
    await client.query('BEGIN');
    
    // First, delete all existing data
    await client.query('DELETE FROM group_emails');
    await client.query('DELETE FROM email_groups');
    
    console.log('Cleared existing data');
    
    // Stats to track the import process
    const stats = {
      groups: 0,
      emails: 0
    };
    
    // Process groups
    const uniqueGroups = new Set();
    const groupNameToId = {};
    
    // First pass: collect all unique group names
    data.forEach(row => uniqueGroups.add(row.Group));
    
    // For each unique group, create it
    for (const groupName of uniqueGroups) {
      const newGroup = await client.query(
        'INSERT INTO email_groups (name) VALUES ($1) RETURNING id',
        [groupName]
      );
      
      groupNameToId[groupName] = newGroup.rows[0].id;
      stats.groups++;
    }
    
    console.log(`Created ${stats.groups} new groups`);
    
    // Process emails
    for (const row of data) {
      // Skip invalid emails
      if (!row.Email || !row.Email.includes('@')) continue;
      
      const groupId = groupNameToId[row.Group];
      const email = row.Email.trim();
      
      try {
        // Insert the email, handling duplicate constraint violations
        await client.query(
          `INSERT INTO group_emails (group_id, email) 
           VALUES ($1, $2)
           ON CONFLICT (group_id, email) DO NOTHING`,
          [groupId, email]
        );
        
        stats.emails++;
      } catch (err) {
        // Log any errors but continue processing
        console.error(`Error inserting email ${email}:`, err.message);
      }
    }
    
    console.log(`Added ${stats.emails} emails`);
    
    // Commit the transaction
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