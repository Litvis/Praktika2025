import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple potential paths
const possiblePaths = [
  path.resolve(__dirname, '../../.env'),     // Project root from backend
  path.resolve(process.cwd(), '.env'),       // Current working directory
  path.resolve(__dirname, '.env')            // Current directory
];

let loadedPath = null;
for (const envPath of possiblePaths) {
  console.log(`Checking path: ${envPath}`);
  if (fs.existsSync(envPath)) {
    loadedPath = envPath;
    console.log(`✅ Found .env at: ${loadedPath}`);
    dotenv.config({ path: loadedPath });
    break;
  }
}

if (!loadedPath) {
  console.warn('❌ No .env file found. Using environment variables from the system.');
}

const { Pool } = pkg;

// Create pool connection 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Debugging logs
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