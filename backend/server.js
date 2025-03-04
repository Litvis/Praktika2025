import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const { Client } = pkg;

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  

client.connect();

app.post('/messages', async (req, res) => {
  console.log("📩 Incoming request body:", req.body); // ✅ Log the data
  const { subject, description, recipient_email } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO messages (subject, description, recipient_email) VALUES ($1, $2, $3) RETURNING *',
      [subject, description, recipient_email]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).send('Error saving message');
  }
});


app.get('/messages', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching messages');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
