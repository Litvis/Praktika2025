import express from 'express';
import passport from 'passport';
import { pool } from '../db.js';

const router = express.Router();

// Google OAuth callback route with role-based redirection
router.get('/auth/google/callback', (req, res, next) => {
  const FRONTEND_URL = process.env.FRONTEND_URL;

  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    
    if (!user) {
      console.error('User not found or not authorized');
      return res.redirect(`${FRONTEND_URL}/login?error=unauthorized`);
    }

    try {
      // Log user information before login
      console.log('User found, attempting login:', {
        id: user.id,
        email: user.emails?.[0]?.value,
        role: user.role
      });

      // Perform login with session
      req.login(user, { session: true }, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return next(loginErr);
        }

        // Log session after login
        console.log('Session after login:', req.session);
        console.log('Session ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());

        // Set a successful login cookie with appropriate settings
        res.cookie('loggedIn', 'true', {
          httpOnly: false, // Allow JavaScript access
          secure: true,    // HTTPS only
          sameSite: 'none', // Allow cross-site
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect based on role from the database
        if (user.role === 'admin') {
          return res.redirect(`${FRONTEND_URL}/irankis`);
        } else if (user.role === 'worker') {
          return res.redirect(`${FRONTEND_URL}/irankis`);
        } else {
          return res.redirect(`${FRONTEND_URL}/login`);
        }
      });
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      return res.redirect(`${FRONTEND_URL}/login?error=server`);
    }
  })(req, res, next);
});

// Login route
router.get('/login', (req, res) => {
  // If already authenticated, redirect based on role
  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (req.isAuthenticated()) {
    const user = req.user;
    console.log('User already authenticated:', user);
    
    if (user.role === 'admin') {
      return res.redirect(`${FRONTEND_URL}/irankis`);
    }
    return res.redirect(`${FRONTEND_URL}/irankis`);
  }
  
  // Redirect to Google OAuth authentication
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Force Google account selection
  })(req, res);
});

// Google OAuth initial route
router.get('/auth/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Force Google account selection
  })
);

// User profile endpoint - UPDATED to use req.isAuthenticated
router.get('/api/user/profile', (req, res) => {
  console.log('Profile request received');
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('Session:', req.session);
  console.log('User:', req.user);
  
  if (req.isAuthenticated()) {
    // Format user info for frontend
    const userInfo = {
      id: req.user.id,
      displayName: req.user.displayName || req.user.name,
      firstName: req.user.name?.givenName,
      lastName: req.user.name?.familyName,
      email: req.user.emails?.[0]?.value || req.user.email,
      role: req.user.role || 'worker'
    };
    
    console.log('Sending user info to frontend:', userInfo);
    res.json({ success: true, user: userInfo });
  } else {
    console.log('User not authenticated');
    res.status(401).json({ success: false, error: 'Not authenticated' });
  }
});

// Auth status check endpoint (for debugging)
router.get('/api/check-auth', (req, res) => {
  console.log('Auth check request received');
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('Session:', req.session);
  console.log('User:', req.user);
  
  if (req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        email: req.user.emails?.[0]?.value || req.user.email,
        role: req.user.role
      }
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Logout route
router.get('/logout', (req, res, next) => {
  const FRONTEND_URL = process.env.FRONTEND_URL;
  console.log('Logout request received');
  // Clear the session
  req.logout((err) => {
    if (err) { 
      console.error('Logout error:', err);
      return next(err); 
    }
    
    // Clear cookies
    res.clearCookie('connect.sid');
    res.clearCookie('loggedIn');
    
    console.log('User logged out successfully');
    res.redirect(`${FRONTEND_URL}/login`);
  });
});

export default router;