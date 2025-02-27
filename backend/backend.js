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

  const recipientsArray = recipient.split(',').map(email => email.trim());

  if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
    return res.status(400).send('Invalid recipient email(s)');
  }

  const msg = {
    to: recipientsArray.map(email => ({ email })),
    from: 'deividaslitvinenko4@gmail.com',
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    const response = await sgMail.send(msg);

    console.log('SendGrid response:', response);

    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('SendGrid error:', error.response ? error.response.body : error);

    if (error.response && error.response.body) {
      console.error('Error details:', JSON.stringify(error.response.body, null, 2));
    }


    res.status(500).send('Failed to send email');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
