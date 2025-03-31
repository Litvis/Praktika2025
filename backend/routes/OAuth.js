import express from 'express';
import passport from 'passport';
import { pool } from '../db.js';

const router = express.Router();

// Google OAuth callback route with role-based redirection
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      // User not found or not authorized
      return res.redirect('/login?error=unauthorized');
    }

    try {
      // Perform login
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }

        // Redirect based on role from the database
        if (user.role === 'admin') {
          return res.redirect('https://praktika2025.vercel.app/admin/dashboard');
        } else if (user.role === 'worker') {
          return res.redirect('https://praktika2025.vercel.app/dashboard');
        } else {
          return res.redirect('https://praktika2025.vercel.app/login');
        }
      });
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      return res.redirect('/login');
    }
  })(req, res, next);
});

// Login route
router.get('/login', (req, res) => {
  // If already authenticated, redirect based on role
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user.role === 'admin') {
      return res.redirect('https://praktika2025.vercel.app/admin/dashboard');
    }
    return res.redirect('https://praktika2025.vercel.app/dashboard');
  }
  
  // Redirect to Google OAuth authentication
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
});

// Google OAuth initial route
router.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: req.user,
      isAdmin: req.user.role === 'admin'
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});


// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

export default router;