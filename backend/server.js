import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const app = express();

// Comprehensive CORS Configuration
const corsOptions = {
  origin: [
    'https://praktika2025-6dq2.vercel.app', 
    'https://praktika2025-6dq2-52d2rvhg4-deividas-projects-55dbf9c2.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// CORS Middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for NeonDB
});

// ✅ Test DB Connection
pool.connect()
  .then(() => console.log("✅ Connected to NeonDB"))
  .catch(err => console.error("❌ Database Connection Error:", err));

// ✅ Sample API Route
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).send('Error fetching messages');
  }
});

app.listen(10000, () => {
  console.log('🚀 Server running on port 10000');
});