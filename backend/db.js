import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Correctly get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly set the path to the .env file in the backend directory
const envPath = path.resolve(__dirname, '.env');

console.log('Attempting to load .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

// Load the environment variables
dotenv.config({ path: envPath });

const { Pool } = pkg;

// Create pool connection 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Extensive logging
console.log('Environment Variables:');
console.log('Current Working Directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not Found');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? 'Found' : 'Not Found');

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export { pool };