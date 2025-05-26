import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
};

router.get('/api/admin/users', requireAdmin, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    const role = req.query.role || 'all';

    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        LOWER(email) LIKE LOWER($${paramIndex}) OR 
        LOWER(name) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role !== 'all') {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const usersResult = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    paramIndex = 1;

    if (search) {
      countQuery += ` AND (
        LOWER(email) LIKE LOWER($${paramIndex}) OR 
        LOWER(name) LIKE LOWER($${paramIndex})
      )`;
      countParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role !== 'all') {
      countQuery += ` AND role = $${paramIndex}`;
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.post('/api/admin/approve-user', requireAdmin, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND role = $3 RETURNING *',
      ['worker', id, 'pending']
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found or already approved' });
    }
    
    res.json({ success: true, user: updateResult.rows[0] });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ success: false, error: 'Failed to approve user' });
  }
});

router.post('/api/admin/promote-user', requireAdmin, async (req, res) => {
  const { FRONTEND_URL } = req.app.locals.config;
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND role = $3 RETURNING *',
      ['admin', id, 'worker']
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found or already an admin' });
    }
    
    res.json({ success: true, user: updateResult.rows[0] });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ success: false, error: 'Failed to promote user' });
  }
});

router.post('/api/admin/demote-user', requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const currentUserId = req.user.id;
    
    if (currentUserId === id) {
      return res.status(400).json({ success: false, error: 'Cannot demote yourself' });
    }
    
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND role = $3 RETURNING *',
      ['worker', id, 'admin']
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found or not an admin' });
    }
    
    res.json({ success: true, user: updateResult.rows[0] });
  } catch (error) {
    console.error('Error demoting user:', error);
    res.status(500).json({ success: false, error: 'Failed to demote user' });
  }
});

router.delete('/api/admin/delete-user', requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const currentUserId = req.user.id;
    
    if (currentUserId === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }
    
    const deleteResult = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

router.post('/api/modify-google-oauth', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Instructions: Modify your Google OAuth callback to set role as "pending" instead of "worker"' 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/api/check-approval-status', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    
    res.json({
      success: true,
      approved: userRole !== 'pending',
      role: userRole
    });
  } catch (error) {
    console.error('Error checking approval status:', error);
    res.status(500).json({ success: false, error: 'Failed to check approval status' });
  }
});

export default router;