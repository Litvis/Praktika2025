import express from 'express';
import session from 'express-session';
import passport from 'passport';
import pgSession from 'connect-pg-simple';
import { pool } from '../db.js';

const PgStore = pgSession(session);

const sessionStore = new PgStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

function setupSessionMiddleware(app) {
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your_fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}

export { setupSessionMiddleware };