// db.js
import { createPool } from './db-utils.js';

const pool = createPool();

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export { pool };