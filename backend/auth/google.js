import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; // Import the strategy directly
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  // Handle user profile data or any other logic
  return done(null, profile);
}));

// In your auth/google.js file or OAuth callback route
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Get the user profile from OAuth
      const userProfile = req.user;
      const email = userProfile.emails[0].value;
      const name = userProfile.displayName || `${userProfile.name.givenName} ${userProfile.name.familyName}`;
      
      // Check if user exists in our database
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (userResult.rows.length === 0) {
        // User doesn't exist, add them with default 'worker' role
        await pool.query(
          'INSERT INTO users (email, name, role) VALUES ($1, $2, $3)',
          [email, name, 'worker']
        );
        
        // Add role to the user object in the session
        req.user.role = 'worker';
      } else {
        // User exists, get their role from the database
        const userRole = userResult.rows[0].role;
        
        // Add role to the user object in the session
        req.user.role = userRole;
      }
      
      // Redirect based on role
      if (req.user.role === 'admin') {
        res.redirect('/adminLanding'); // Admin dashboard
      } else {
        res.redirect('/irankis'); // Regular worker dashboard
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.redirect('/login?error=auth_error');
    }
  }
);





// Serialize user (typically stores user ID in session)
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user (retrieves user from session)
passport.deserializeUser((user, done) => {
  done(null, user);
});
