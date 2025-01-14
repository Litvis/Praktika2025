// backend/backend.js (updated for ES modules)
import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';


const app = express();
dotenv.config();
// Enable CORS (for development)
app.use(cors());
app.use(express.json());  // To parse incoming JSON requests

// Set SendGrid API key (Make sure to set it as an environment variable)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  // Check if recipient email is valid
  if (!recipient || !recipient.includes('@')) {
    return res.status(400).send('Invalid recipient email');
  }

  const msg = {
    to: [{ email: recipient }],  // Ensure `to` is an array of objects with `email`
    from: 'deividaslitvinenko4@gmail.com',
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    // Send email via SendGrid
    await sgMail.send(msg);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.response.body);
    res.status(500).send('Failed to send email');
  }
});


// Start backend server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
