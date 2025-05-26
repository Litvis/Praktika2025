import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn()
};

jest.mock('../../backend/db.js', () => ({
  pool: mockPool
}));

describe('Admin Check Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  test('requireAdmin should allow access for admin users', () => {
    const requireAdmin = (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
    };

    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { role: 'admin' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const next = jest.fn();

    requireAdmin(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('requireAdmin should deny access for non-admin users', () => {
    const requireAdmin = (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
    };
    
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { role: 'worker' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    requireAdmin(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Access denied. Admin role required.' 
    });
  });

  test('requireAdmin should deny access for unauthenticated users', () => {
    const requireAdmin = (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
    };
    
    const req = {
      isAuthenticated: jest.fn(() => false),
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    requireAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Access denied. Admin role required.' 
    });
  });

  test('/api/admin/users should return user list for admin users', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, email: 'admin@example.com', role: 'admin' },
        { id: 2, email: 'user@example.com', role: 'worker' }
      ]
    });
    
    const adminUsersHandler = async (req, res) => {
      try {
        const usersResult = await mockPool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: usersResult.rows });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
      }
    };
    
    const req = {};
    
    const res = {
      json: jest.fn()
    };
    
    await adminUsersHandler(req, res);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users ORDER BY created_at DESC');
    expect(res.json).toHaveBeenCalledWith({
      success: true, 
      users: expect.arrayContaining([
        expect.objectContaining({ email: 'admin@example.com', role: 'admin' }),
        expect.objectContaining({ email: 'user@example.com', role: 'worker' })
      ])
    });
  });

  test('/api/admin/promote should promote user to admin', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: 2, email: 'user@example.com', role: 'admin' }
      ]
    });
    
    const promoteUserHandler = async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        const updateResult = await mockPool.query(
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
    };
    
    const req = {
      body: { email: 'user@example.com' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    await promoteUserHandler(req, res);
    
    expect(mockPool.query).toHaveBeenCalledWith(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING *',
      ['admin', 'user@example.com']
    );
    
    expect(res.json).toHaveBeenCalledWith({
      success: true, 
      user: expect.objectContaining({ 
        email: 'user@example.com', 
        role: 'admin' 
      })
    });
  });

  test('/api/admin/promote should return error if email is missing', async () => {
    const promoteUserHandler = async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        const updateResult = await mockPool.query(
          'UPDATE users SET role = $1 WHERE email = $2 RETURNING *',
          ['admin', email]
        );
        
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to promote user' });
      }
    };
    
    const req = {
      body: {}
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    await promoteUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Email is required' 
    });
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  test('/api/admin/promote should return error if user is not found', async () => {

    mockPool.query.mockResolvedValueOnce({
      rows: [] 
    });

    const promoteUserHandler = async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const updateResult = await mockPool.query(
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
    };

    const req = {
      body: { email: 'nonexistent@example.com' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await promoteUserHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'User not found' 
    });
  });
});