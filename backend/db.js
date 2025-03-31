import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Create the pool instance - this will work with your Neon database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Your Neon database URL
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Add error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Neon database connection error:', err);
  } else {
    console.log('Connected to Neon PostgreSQL successfully at:', res.rows[0].now);
  }
});

export { pool };