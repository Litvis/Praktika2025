import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth2';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config();

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
      const user = userResult.rows[0];
      done(null, {
        ...user,
        emails: [{ value: userData.email }],
        role: user.role
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
    // Check if user exists in our database and get their role
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

    // Attach role to the profile
    profile.role = user.role;
    
    return done(null, profile);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return done(error);
  }
}));

export default passport;