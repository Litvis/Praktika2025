import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth2';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config();

// Create the router
const router = express.Router();

// Configure Passport serialization
passport.serializeUser((user, done) => {
  // Explicitly handle the serialization
  try {
    // Ensure we have an email to serialize
    const email = user.emails && user.emails[0] ? user.emails[0].value : null;
    
    if (!email) {
      return done(new Error('No email found for user'));
    }

    // Create a simplified user object to store in the session
    done(null, {
      id: user.id || null,
      email: email,
      role: user.role || 'worker'
    });
  } catch (error) {
    done(error);
  }
});

passport.deserializeUser(async (userData, done) => {
  try {
    // Validate the userData
    if (!userData || !userData.email) {
      return done(new Error('Invalid user data'));
    }

    // Fetch the full user from the database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      done(null, {
        id: user.id,
        name: {
          givenName: user.name ? user.name.split(' ')[0] : '',
          familyName: user.name ? user.name.split(' ')[1] : ''
        },
        displayName: user.name,
        emails: [{ value: user.email }],
        role: user.role || 'worker'
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
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
  try {
    // Validate profile
    if (!profile || !profile.emails || !profile.emails[0]) {
      return done(null, false, { message: 'Invalid profile information' });
    }

    // Check if user exists in our database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [profile.emails[0].value]
    );
    
    // If user doesn't exist in the database, deny access
    if (userResult.rows.length === 0) {
      return done(null, false, { message: 'User not authorized' });
    }

    // Get the user from the database
    const user = userResult.rows[0];

    // Create a normalized user object
    const normalizedUser = {
      id: user.id,
      emails: profile.emails,
      name: {
        givenName: profile.name?.givenName || '',
        familyName: profile.name?.familyName || ''
      },
      displayName: profile.displayName,
      role: user.role || 'worker'
    };
    
    return done(null, normalizedUser);
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
    successRedirect: 'https://praktika2025.vercel.app/irankis'
  })
);

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

export default router;