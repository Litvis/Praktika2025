import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';

dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['https://your-vercel-frontend-url.com', 'http://localhost:8080'], // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Only for development, use proper SSL in production
  }
});

// Test Database Connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
    return;
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('Error executing query', err.stack);
    } else {
      console.log('Database connected successfully');
    }
  });
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/messages', async (req, res) => {
  const { recipient_email, subject, description } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO messages (recipient_email, subject, description) VALUES ($1, $2, $3) RETURNING *',
      [recipient_email, subject, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database insertion error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  const recipientsArray = recipient
    ? recipient.split(',').map(email => email.trim())
    : [];

  if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
    return res.status(400).json({ error: 'Invalid recipient email(s)' });
  }

  const msg = {
    to: recipientsArray,
    from: 'deividaslitvinenko4@gmail.com',
    subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    await sgMail.send(msg);

    // Save to database
    await pool.query(
      'INSERT INTO messages (recipient_email, subject, description) VALUES ($1, $2, $3)',
      [recipient, subject, message]
    );

    res.status(200).json({ success: true, message: 'Email sent and saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send email or save to database' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;