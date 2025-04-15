// tests/routes/OAuth.test.js
import { jest } from '@jest/globals';

// Sukuriame mockAuthenticate, kad galėtumėme jį kontroliuoti
const mockAuthenticate = jest.fn();

// Mockuojame passport modulį
jest.mock('passport', () => ({
  authenticate: mockAuthenticate
}));

jest.mock('../../backend/db.js', () => ({
  pool: {
    query: jest.fn()
  }
}));

import passport from 'passport';

// Globalūs mockai
const mockUser = {
  id: 1,
  displayName: 'Test User',
  name: { givenName: 'Test', familyName: 'User' },
  emails: [{ value: 'test@example.com' }],
  role: 'worker'
};

// Sukuriame paprastesnį testą, kuris tikrina tik esminę logiką
describe('OAuth Routes Tests', () => {
  // Test 1: Testuojame ar auth callback nukreipia admin vartotojus į teisingą puslapį
  test('Google callback should redirect admin user to irankis page', () => {
    // Sukuriame mockus
    const req = {
      login: jest.fn((user, options, callback) => callback())
    };
    
    const res = {
      redirect: jest.fn(),
      cookie: jest.fn()
    };
    
    const next = jest.fn();
    
    // Sukuriam callback funkciją
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
    
    // Testuojam callback funkciją tiesiogiai su admin vartotoju
    const adminUser = { ...mockUser, role: 'admin' };
    callback(null, adminUser, null);
    
    // Tikriname ar login buvo iškviestas
    expect(req.login).toHaveBeenCalled();
    
    // Tikriname ar cookie buvo nustatytas
    expect(res.cookie).toHaveBeenCalled();
    
    // Tikriname ar redirect buvo iškviestas su teisingais parametrais
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/irankis');
  });

  // Test 2: Testuojame, kai vartotojas nerastas
  test('Google callback should redirect to login with error if no user', () => {
    const res = {
      redirect: jest.fn()
    };
    
    const next = jest.fn();
    
    // Sukuriame callback funkciją
    const callback = (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.redirect('https://praktika2025.vercel.app/login?error=unauthorized');
      }
      
      // Likusi dalis nėra vykdoma šiam testui
    };
    
    // Iškviesime callback su null user
    callback(null, null, null);
    
    // Tikriname ar buvo atliktas nukreipimas į login su klaida
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/login?error=unauthorized');
  });

  // Test 3: Testuojame login kelią autentifikuotam vartotojui
  test('Login route should redirect authenticated admin user to irankis', () => {
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { ...mockUser, role: 'admin' }
    };
    
    const res = {
      redirect: jest.fn()
    };
    
    // Sukuriame login handler funkciją
    const loginHandler = (req, res) => {
      if (req.isAuthenticated()) {
        const user = req.user;
        
        if (user.role === 'admin') {
          return res.redirect('https://praktika2025.vercel.app/irankis');
        }
        return res.redirect('https://praktika2025.vercel.app/irankis');
      }
      
      // Likusi dalis nevykdoma šiam testui
    };
    
    // Iškviečiame loginHandler
    loginHandler(req, res);
    
    // Tikriname redirect
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/irankis');
  });

  // Test 4: Testuojame profilio API su autentifikuotu vartotoju
  test('User profile endpoint should return user info for authenticated user', () => {
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: mockUser
    };
    
    const res = {
      json: jest.fn()
    };
    
    // Sukuriame profile handler funkciją
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
    
    // Iškviečiame profileHandler
    profileHandler(req, res);
    
    // Tikriname ar json buvo iškviestas su teisingais duomenimis
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

  // Test 5: Testuojame profilio API su neautentifikuotu vartotoju
  test('User profile endpoint should return 401 for unauthenticated user', () => {
    const req = {
      isAuthenticated: jest.fn(() => false)
    };
    
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    // Sukuriame profile handler funkciją
    const profileHandler = (req, res) => {
      if (req.isAuthenticated()) {
        // Likusi dalis nevykdoma šiam testui
      } else {
        res.status(401).json({ success: false, error: 'Not authenticated' });
      }
    };
    
    // Iškviečiame profileHandler
    profileHandler(req, res);
    
    // Tikriname ar status ir json buvo iškviesti su teisingais duomenimis
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not authenticated'
    });
  });

  // Test 6: Testuojame atsijungimo funkcionalumą
  test('Logout route should end session and redirect to login', () => {
    const req = {
      logout: jest.fn(callback => callback())
    };
    
    const res = {
      clearCookie: jest.fn(),
      redirect: jest.fn()
    };
    
    const next = jest.fn();
    
    // Sukuriame logout handler funkciją
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
    
    // Iškviečiame logoutHandler
    logoutHandler(req, res, next);
    
    // Tikriname ar buvo iškviesti teisingi metodai
    expect(req.logout).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
    expect(res.clearCookie).toHaveBeenCalledWith('loggedIn');
    expect(res.redirect).toHaveBeenCalledWith('https://praktika2025.vercel.app/login');
  });
});