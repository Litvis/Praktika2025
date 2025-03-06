// In routes/OAuth.js

import express from 'express';
import passport from 'passport';

const router = express.Router();

// Google OAuth route
router.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // On successful authentication, redirect to the frontend
    res.redirect('http://localhost:3000/dashboard'); // This should redirect to the frontend's dashboard
  }
);

// In routes/OAuth.js (Backend)

router.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user); // Sends the user profile to the frontend
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
  

// Dashboard route
router.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.send(`Hello, ${req.user.displayName}`);
});

export default router;
