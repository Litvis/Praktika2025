import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth2';
import dotenv from 'dotenv';
import { pool } from '../db.js'; // Assuming you have a db connection file

dotenv.config();

// Create the router
const router = express.Router();

// Configure the Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists in our database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
    
    if (userResult.rows.length === 0) {
      // User doesn't exist, add them with default 'worker' role
      const newUser = await pool.query(
        'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
        [profile.emails[0].value, profile.displayName, 'worker']
      );
      
      // Add role to profile
      profile.role = 'worker';
    } else {
      // User exists, get their role
      profile.role = userResult.rows[0].role;
    }
    
    return done(null, profile);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return done(error);
  }
}));

// Google OAuth routes
router.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Redirect based on role
      if (req.user.role === 'admin') {
        res.redirect('/adminLanding');
      } else {
        res.redirect('/dashboard');
      }
    } catch (error) {
      console.error('Error in redirect:', error);
      res.redirect('/login?error=auth_error');
    }
  }
);

// Serialize/Deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Export the router
export default router;