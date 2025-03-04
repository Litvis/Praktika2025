import pg from 'pg';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['praktika2025-6dq2-52d2rvhg4-deividas-projects-55dbf9c2.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false 
  }
});

// Database Connection Test
pool.connect()
  .then(client => {
    console.log("✅ Successfully connected to NeonDB");
    
    // Test a simple query
    return client.query('SELECT NOW()')
      .then(result => {
        console.log("📅 Current Database Time:", result.rows[0].now);
        client.release(); // Release the client back to the pool
      })
      .catch(err => {
        console.error("❌ Query Execution Error:", err);
        client.release();
      });
  })
  .catch(err => {
    console.error("❌ Database Connection Error:", err);
  });

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Send Email Endpoint
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  try {
    // Log incoming request
    console.log('Received email request:', { recipient, subject });

    // Optional: Save to database
    const saveResult = await pool.query(
      'INSERT INTO messages (recipient_email, subject, description) VALUES ($1, $2, $3) RETURNING *',
      [recipient, subject, message]
    );

    // Simulate email sending (replace with actual email sending logic)
    res.status(200).json({
      message: 'Email processed successfully',
      databaseRecord: saveResult.rows[0]
    });
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ 
      error: 'Failed to process email', 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;