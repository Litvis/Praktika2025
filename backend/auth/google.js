import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth2';
import dotenv from 'dotenv';
import { pool } from '../db.js'; // Assuming you have a db connection file

dotenv.config();

// Create the router
const router = express.Router();

// Configure Passport serialization
passport.serializeUser((user, done) => {
  // Serialize just the essential user information
  done(null, {
    email: user.emails[0].value,
    role: user.role
  });
});

passport.deserializeUser(async (userData, done) => {
  try {
    // Fetch the full user from the database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
    
    if (userResult.rows.length > 0) {
      done(null, {
        ...userResult.rows[0],
        emails: [{ value: userData.email }],
        role: userData.role
      });
    } else {
      done(new Error('User not found'));
    }
  } catch (error) {
    done(error);
  }
});

// Configure the Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists in our database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
    
    let user;
    if (userResult.rows.length === 0) {
      // User doesn't exist, add them with default 'worker' role
      const newUserResult = await pool.query(
        'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
        [profile.emails[0].value, profile.displayName, 'worker']
      );
      user = newUserResult.rows[0];
      profile.role = 'worker';
    } else {
      // User exists
      user = userResult.rows[0];
      profile.role = user.role;
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
  passport.authenticate('google', { 
    failureRedirect: '/login',
    successRedirect: '/dashboard'
  })
);

// Logout route
router.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Export the router
export default router;