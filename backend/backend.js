import pg from 'pg';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

const { Pool } = pg;
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

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Database Connection Test
pool.connect()
  .then(client => {
    console.log("✅ Successfully connected to NeonDB");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database Connection Error:", err);
  });

// Send Email Endpoint
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  try {
    // Log incoming request
    console.log('Received email request:', { recipient, subject });

    // Prepare email message for SendGrid
    const msg = {
      to: recipient,
      from: 'deividaslitvinenko4@gmail.com', // Verified SendGrid sender
      subject: subject,
      text: message,
      html: `<p>${message}</p>`
    };

    // Send email via SendGrid
    await sgMail.send(msg);

    // Save to database
    const saveResult = await pool.query(
      'INSERT INTO messages (recipient_email, subject, description) VALUES ($1, $2, $3) RETURNING *',
      [recipient, subject, message]
    );

    res.status(200).json({
      message: 'Email sent and saved successfully',
      databaseRecord: saveResult.rows[0]
    });
  } catch (error) {
    console.error('Error processing email:', error);
    
    // More detailed error response
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message,
      stack: error.stack
    });
  }
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;