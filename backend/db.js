import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Pool } = pkg;

// Create pool connection 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export { pool };