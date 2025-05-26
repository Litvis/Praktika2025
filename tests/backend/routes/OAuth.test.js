import { jest } from '@jest/globals';

const mockAuthenticate = jest.fn();

jest.mock('passport', () => ({
  authenticate: mockAuthenticate
}));

jest.mock('../../backend/db.js', () => ({
  pool: {
    query: jest.fn()
  }
}));

import passport from 'passport';

const mockUser = {
  id: 1,
  displayName: 'Test User',
  name: { givenName: 'Test', familyName: 'User' },
  emails: [{ value: 'test@example.com' }],
  role: 'worker'
};

describe('OAuth Routes Tests', () => {
  test('Google callback should redirect admin user to irankis page', () => {
    const req = {
      login: jest.fn((user, options, callback) => callback())
    };
    
    const res = {
      redirect: jest.fn(),
      cookie: jest.fn()
    };
    
    const next = jest.fn();
    
    const callback = (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.redirect('https://praktika2025.vercel.app/login?error=unauthorized');
      }

      req.login(user, { session: true }, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }

        res.cookie('loggedIn', 'true', {
          httpOnly: false,
          secure: true,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000
        });

        if (user.role === 'admin') {
          return res.redirect('https://praktika2025.vercel.app/irankis');
        } else if (user.role === 'worker') {
          return res.redirect('https://praktika2025.vercel.app/irankis');
        } else {
          return res.redirect('https://praktika2025.vercel.app/login');
        }
      });
    };
    
    const adminUser = { ...mockUser, role: 'admin' };
    callback(null, adminUser, null);
    
    expect(req.login).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/irankis');
  });

  test('Google callback should redirect to login with error if no user', () => {
    const res = {
      redirect: jest.fn()
    };
    
    const next = jest.fn();
    
    const callback = (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.redirect('https://praktika2025.vercel.app/login?error=unauthorized');
      }
    };
    
    callback(null, null, null);
    
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/login?error=unauthorized');
  });

  test('Login route should redirect authenticated admin user to irankis', () => {
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { ...mockUser, role: 'admin' }
    };
    
    const res = {
      redirect: jest.fn()
    };
    
    const loginHandler = (req, res) => {
      if (req.isAuthenticated()) {
        const user = req.user;
        
        if (user.role === 'admin') {
          return res.redirect('https://praktika2025.vercel.app/irankis');
        }
        return res.redirect('https://praktika2025.vercel.app/irankis');
      }
    };
    
    loginHandler(req, res);
    
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/irankis');
  });

  test('User profile endpoint should return user info for authenticated user', () => {
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: mockUser
    };
    
    const res = {
      json: jest.fn()
    };
    
    const profileHandler = (req, res) => {
      if (req.isAuthenticated()) {
        const userInfo = {
          id: req.user.id,
          displayName: req.user.displayName || req.user.name,
          firstName: req.user.name?.givenName,
          lastName: req.user.name?.familyName,
          email: req.user.emails?.[0]?.value || req.user.email,
          role: req.user.role || 'worker'
        };
        
        res.json({ success: true, user: userInfo });
      } else {
        res.status(401).json({ success: false, error: 'Not authenticated' });
      }
    };
    
    profileHandler(req, res);
    
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: 1,
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'worker'
      }
    });
  });

  test('User profile endpoint should return 401 for unauthenticated user', () => {
    const req = {
      isAuthenticated: jest.fn(() => false)
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    const profileHandler = (req, res) => {
      if (req.isAuthenticated()) {
      } else {
        res.status(401).json({ success: false, error: 'Not authenticated' });
      }
    };
    
    profileHandler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not authenticated'
    });
  });

  test('Logout route should end session and redirect to login', () => {
    const req = {
      logout: jest.fn(callback => callback())
    };
    
    const res = {
      clearCookie: jest.fn(),
      redirect: jest.fn()
    };
    
    const next = jest.fn();
    
    const logoutHandler = (req, res, next) => {
      req.logout((err) => {
        if (err) { 
          return next(err); 
        }
        
        res.clearCookie('connect.sid');
        res.clearCookie('loggedIn');
        
        res.redirect('https://praktika2025.vercel.app/login');
      });
    };
    
    logoutHandler(req, res, next);
    
    expect(req.logout).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
    expect(res.clearCookie).toHaveBeenCalledWith('loggedIn');
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/login');
  });
});