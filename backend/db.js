import { createPool } from './db-utils.js';

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export { pool };