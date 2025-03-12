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





// Serialize user (typically stores user ID in session)
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user (retrieves user from session)
passport.deserializeUser((user, done) => {
  done(null, user);
});
