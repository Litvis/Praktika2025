import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const isLocalDatabase = (connectionString) => {
  return !connectionString || 
         connectionString.includes('localhost') || 
         connectionString.includes('127.0.0.1');
};

export function createPool() {
  const sslConfig = isLocalDatabase(process.env.DATABASE_URL) 
    ? false 
    : { rejectUnauthorized: false };

  console.log(`Database connection: ${isLocalDatabase(process.env.DATABASE_URL) ? 'Local' : 'Remote'} SSL: ${sslConfig ? 'Enabled' : 'Disabled'}`);

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}