import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();
dotenv.config();


app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  // Ensure recipient is an array
  const recipientsArray = recipient
    ? recipient.split(',').map(email => email.trim())
    : [];

  if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
    return res.status(400).json({ error: 'Invalid recipient email(s)' });
  }

  const msg = {
    to: recipientsArray, // SendGrid expects an array
    from: 'deividaslitvinenko4@gmail.com',
    subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ SendGrid error:', error.response?.body || error.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
