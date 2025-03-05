import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Set up PostgreSQL client
const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect();

app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;
  console.log("📤 Incoming request from frontend:", req.body);

  // Validate recipient email(s)
  const recipientsArray = recipient
    ? recipient.split(',').map(email => email.trim())
    : [];

  if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
    console.log("❌ Invalid recipient email");
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
    // Send email via SendGrid
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");

    // Save the email data to the database
    const dbResult = await client.query(
      'INSERT INTO messages (subject, description, recipient_email) VALUES ($1, $2, $3) RETURNING *',
      [subject, message, recipient]
    );
    console.log("✅ Saved to DB:", dbResult.rows[0]);

    // Respond with success message
    res.status(200).json({ success: true, message: 'Email sent and saved successfully' });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to send email or save to database', details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
