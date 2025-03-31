import express from 'express';
import session from 'express-session';
import passport from 'passport';
import pgSession from 'connect-pg-simple';
import { pool } from '../db.js'; // Ensure you have a db connection file

// Configure session store
const PgStore = pgSession(session);

// Create session store
const sessionStore = new PgStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

// Function to set up session middleware
function setupSessionMiddleware(app) {
  // Session middleware configuration
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your_fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  }));

  // Initialize Passport and restore authentication state, if any, from the session
  app.use(passport.initialize());
  app.use(passport.session());
}

export { setupSessionMiddleware };