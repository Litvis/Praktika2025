import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth2';
import dotenv from 'dotenv';
import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from project root
dotenv.config({ 
  path: path.resolve(__dirname, '../../.env') 
});

// Create the router
const router = express.Router();

// List of allowed specific email addresses for non-company domains
const ALLOWED_EMAILS = [
  'deividaslitvinenko4@gmail.com', 
  'deividaslita@gmail.com'
]; // Test accounts

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
      role: user.role || 'pending' // Default to pending instead of worker
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
        role: user.role || 'pending' // Default to pending instead of worker
      });
    } else {
      done(new Error('User not found'));
    }
  } catch (error) {
    done(error);
  }
});

// Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
  try {
    // Validate profile
    if (!profile || !profile.emails || !profile.emails[0]) {
      console.error('Invalid profile information');
      return done(null, false, { message: 'Invalid profile information' });
    }

    const userEmail = profile.emails[0].value;
    console.log(`OAuth login attempt with email: ${userEmail}`);

    // For personal Gmail accounts, check if they're in the allowed list
    if (!userEmail.endsWith('@uzt.lt')) {
      if (!ALLOWED_EMAILS.includes(userEmail.toLowerCase())) {
        console.log(`Email not allowed: ${userEmail}`);
        return done(null, false, { message: 'Email not allowed' });
      }
      console.log(`Gmail account allowed: ${userEmail}`);
    }

    // Check if user exists in our database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [userEmail]
    );
    
    if (userResult.rows.length === 0) {
      // User doesn't exist - CREATE NEW USER with PENDING status
      console.log(`Creating new user for email: ${userEmail} with pending status`);
      const displayName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
      
      const newUserResult = await pool.query(
        'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
        [userEmail, displayName, 'pending'] // New users get pending role by default
      );
      
      if (newUserResult.rows.length === 0) {
        return done(null, false, { message: 'Failed to create user' });
      }
      
      const newUser = newUserResult.rows[0];
      
      // Create a normalized user object
      const normalizedUser = {
        id: newUser.id,
        emails: profile.emails,
        name: {
          givenName: profile.name?.givenName || '',
          familyName: profile.name?.familyName || ''
        },
        displayName: displayName,
        role: newUser.role || 'pending'
      };
      
      return done(null, normalizedUser);
    }

    // Get the existing user from the database
    const user = userResult.rows[0];
    console.log(`Found existing user: ${user.name} with role: ${user.role}`);

    // Create a normalized user object
    const normalizedUser = {
      id: user.id,
      emails: profile.emails,
      name: {
        givenName: profile.name?.givenName || '',
        familyName: profile.name?.familyName || ''
      },
      displayName: user.name || profile.displayName,
      role: user.role || 'pending'
    };
    
    return done(null, normalizedUser);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return done(error);
  }
}));

// Company email login route (with hd parameter)
router.get('/auth/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    hd: 'uzt.lt' // Restrict to uzt.lt domain
  })
);

// Alternative route for authorized personal emails
router.get('/auth/google-alt', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // No hd parameter
  })
);

// Google OAuth callback handler
router.get('/auth/google/callback', (req, res, next) => {
  console.log('Google OAuth callback received');
  const FRONTEND_URL = process.env.FRONTEND_URL;
  
  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    
    if (!user) {
      console.error('User not found or not authorized:', info?.message || 'Unknown reason');
      
      // Determine the specific error for better user feedback
      let errorType = 'unauthorized';
      if (info && (info.message === 'Email not allowed' || info.message === 'Email domain not allowed')) {
        errorType = 'domain_not_allowed';
      }
      
      return res.redirect(`${FRONTEND_URL}/login?error=${errorType}`);
    }

    try {
      // Log user information before login
      console.log('User authenticated, attempting login:', {
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
        console.log('Session created, ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());

        // Set a successful login cookie with appropriate settings
        res.cookie('loggedIn', 'true', {
          httpOnly: false, // Allow JavaScript access
          secure: true,    // HTTPS only
          sameSite: 'none', // Allow cross-site
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect based on role and approval status
        if (user.role === 'pending') {
          return res.redirect(`${FRONTEND_URL}/authorising`);
        } else if (user.role === 'admin') {
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

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

export default router;