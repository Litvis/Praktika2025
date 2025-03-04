import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const app = express();
app.use(cors());
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
