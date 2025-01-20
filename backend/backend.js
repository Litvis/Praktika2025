import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

// Enable CORS (for development)
app.use(cors());
app.use(express.json());  // To parse incoming JSON requests

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  // Ensure recipients are valid and split into an array
  const recipientsArray = recipient.split(',').map(email => email.trim());

  // Validate that we have at least one valid recipient
  if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
    return res.status(400).send('Invalid recipient email(s)');
  }

  // Create the msg object for SendGrid
  const msg = {
    to: recipientsArray.map(email => ({ email })), // Array of email objects
    from: 'deividaslitvinenko4@gmail.com',
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    // Send email via SendGrid
    const response = await sgMail.send(msg);

    // Log the response from SendGrid for debugging
    console.log('SendGrid response:', response);

    // Respond with success
    res.status(200).send('Email sent successfully');
  } catch (error) {
    // Log detailed error
    console.error('SendGrid error:', error.response ? error.response.body : error);

    if (error.response && error.response.body) {
      console.error('Error details:', JSON.stringify(error.response.body, null, 2));
    }

    // Respond with failure
    res.status(500).send('Failed to send email');
  }
});

// Start the backend server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
