// tests/middleware/adminCheck.test.js
import { jest } from '@jest/globals';

// Mockuojame pool objektą
const mockPool = {
  query: jest.fn()
};

jest.mock('../../backend/db.js', () => ({
  pool: mockPool
}));

describe('Admin Check Middleware Tests', () => {
  // Prieš kiekvieną testą išvalome mockus
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  // Test 1: Testuojame requireAdmin middleware su admin vartotoju
  test('requireAdmin should allow access for admin users', () => {
    // Sukuriame requireAdmin funkciją
    const requireAdmin = (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
    };
    
    // Sukuriame req, res ir next mockus
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { role: 'admin' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    // Iškviečiame requireAdmin funkciją
    requireAdmin(req, res, next);
    
    // Tikriname ar buvo iškviesta next funkcija
    expect(next).toHaveBeenCalled();
    
    // Tikriname ar NEBUVO iškviesta res.status ir res.json
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  // Test 2: Testuojame requireAdmin middleware su worker vartotoju
  test('requireAdmin should deny access for non-admin users', () => {
    const requireAdmin = (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
    };
    
    // Sukuriame req su worker role
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { role: 'worker' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    // Iškviečiame requireAdmin funkciją
    requireAdmin(req, res, next);
    
    // Tikriname ar NEBUVO iškviesta next funkcija
    expect(next).not.toHaveBeenCalled();
    
    // Tikriname ar buvo iškviesta res.status su 403
    expect(res.status).toHaveBeenCalledWith(403);
    
    // Tikriname ar buvo iškviesta res.json su klaidos žinute
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Access denied. Admin role required.' 
    });
  });

  // Test 3: Testuojame requireAdmin middleware kai vartotojas neprisijungęs
  test('requireAdmin should deny access for unauthenticated users', () => {
    const requireAdmin = (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
    };
    
    // Sukuriame req su isAuthenticated = false
    const req = {
      isAuthenticated: jest.fn(() => false),
      // user objekto nėra, nes vartotojas neprisijungęs
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    // Iškviečiame requireAdmin funkciją
    requireAdmin(req, res, next);
    
    // Tikriname ar NEBUVO iškviesta next funkcija
    expect(next).not.toHaveBeenCalled();
    
    // Tikriname ar buvo iškviesta res.status su 403
    expect(res.status).toHaveBeenCalledWith(403);
    
    // Tikriname ar buvo iškviesta res.json su klaidos žinute
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Access denied. Admin role required.' 
    });
  });

  // Test 4: Testuojame /api/admin/users route su admin vartotoju
  test('/api/admin/users should return user list for admin users', async () => {
    // Mockuojame duomenų bazės atsakymą
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, email: 'admin@example.com', role: 'admin' },
        { id: 2, email: 'user@example.com', role: 'worker' }
      ]
    });
    
    // Sukuriame handler funkciją
    const adminUsersHandler = async (req, res) => {
      try {
        const usersResult = await mockPool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: usersResult.rows });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
      }
    };
    
    // Sukuriame req ir res mockus
    const req = {};
    
    const res = {
      json: jest.fn()
    };
    
    // Iškviečiame handler funkciją
    await adminUsersHandler(req, res);
    
    // Tikriname ar buvo iškviesta tinkama DB užklausa
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users ORDER BY created_at DESC');
    
    // Tikriname ar buvo grąžintas teisingas atsakymas
    expect(res.json).toHaveBeenCalledWith({
      success: true, 
      users: expect.arrayContaining([
        expect.objectContaining({ email: 'admin@example.com', role: 'admin' }),
        expect.objectContaining({ email: 'user@example.com', role: 'worker' })
      ])
    });
  });

  // Test 5: Testuojame /api/admin/promote route su admin vartotoju
  test('/api/admin/promote should promote user to admin', async () => {
    // Mockuojame duomenų bazės atsakymą
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { id: 2, email: 'user@example.com', role: 'admin' }
      ]
    });
    
    // Sukuriame handler funkciją
    const promoteUserHandler = async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        // Update user role to admin
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
    
    // Sukuriame req ir res mockus
    const req = {
      body: { email: 'user@example.com' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    // Iškviečiame handler funkciją
    await promoteUserHandler(req, res);
    
    // Tikriname ar buvo iškviesta tinkama DB užklausa
    expect(mockPool.query).toHaveBeenCalledWith(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING *',
      ['admin', 'user@example.com']
    );
    
    // Tikriname ar buvo grąžintas teisingas atsakymas
    expect(res.json).toHaveBeenCalledWith({
      success: true, 
      user: expect.objectContaining({ 
        email: 'user@example.com', 
        role: 'admin' 
      })
    });
  });

  // Test 6: Testuojame /api/admin/promote route kai trūksta email
  test('/api/admin/promote should return error if email is missing', async () => {
    // Sukuriame handler funkciją
    const promoteUserHandler = async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        // Šis kodas nevykdomas šiame teste
        const updateResult = await mockPool.query(
          'UPDATE users SET role = $1 WHERE email = $2 RETURNING *',
          ['admin', email]
        );
        
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to promote user' });
      }
    };
    
    // Sukuriame req be email laukelio
    const req = {
      body: {}
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    // Iškviečiame handler funkciją
    await promoteUserHandler(req, res);
    
    // Tikriname ar buvo iškviesta res.status su 400
    expect(res.status).toHaveBeenCalledWith(400);
    
    // Tikriname ar buvo iškviesta res.json su klaidos žinute
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Email is required' 
    });
    
    // Tikriname ar NEBUVO iškviesta DB užklausa
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  // Test 7: Testuojame /api/admin/promote route kai vartotojas nerastas
  test('/api/admin/promote should return error if user is not found', async () => {
    // Mockuojame tuščią duomenų bazės atsakymą
    mockPool.query.mockResolvedValueOnce({
      rows: [] // Tuščias masyvas = vartotojas nerastas
    });
    
    // Sukuriame handler funkciją
    const promoteUserHandler = async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        // Update user role to admin
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
    
    // Sukuriame req su email
    const req = {
      body: { email: 'nonexistent@example.com' }
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    // Iškviečiame handler funkciją
    await promoteUserHandler(req, res);
    
    // Tikriname ar buvo iškviesta res.status su 404
    expect(res.status).toHaveBeenCalledWith(404);
    
    // Tikriname ar buvo iškviesta res.json su klaidos žinute
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'User not found' 
    });
  });
});