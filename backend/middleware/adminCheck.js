const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
};

// Example of using the middleware
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: usersResult.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/promote', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Update user role to admin
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING *',
      ['admin', email]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: updateResult.rows[0] });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ success: false, error: 'Failed to promote user' });
  }
});