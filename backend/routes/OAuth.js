import express from 'express';
import passport from 'passport';
import { pool } from '../db.js'; // Import pool to check user details

const router = express.Router();

// Google OAuth callback route with role-based redirection
router.get('/auth/google/callback', async (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.redirect('/login');
    }

    try {
      // Fetch user details from database to confirm role
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1', 
        [user.emails[0].value]
      );

      if (userResult.rows.length === 0) {
        return res.redirect('/login');
      }

      const dbUser = userResult.rows[0];

      // Perform login
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }

        // Redirect based on role
        if (dbUser.role === 'admin' && dbUser.email === 'deividaslitvinenko4@gmail.com') {
          return res.redirect('https://praktika2025.vercel.app/admin/dashboard');
        } else if (dbUser.role === 'worker') {
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
    if (user.emails && user.emails[0] && user.emails[0].value === 'deividaslitvinenko4@gmail.com') {
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

// User info route
router.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: req.user,
      isAdmin: req.user.emails && req.user.emails[0] 
        && req.user.emails[0].value === 'deividaslitvinenko4@gmail.com'
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