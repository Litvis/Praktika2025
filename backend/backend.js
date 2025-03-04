import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;

  console.log("📤 Incoming request from frontend:", req.body); // ✅ Log frontend request

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
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");

    console.log("📥 Sending to database:", { recipient, subject, message });

    // ✅ Log before sending the request
    console.log("🔄 Sending request to save email in DB...");

    const response = await axios.post(`${process.env.BACKEND_URL}/messages`, {

      recipient_email: recipient,
      subject: subject,
      description: message, // 🛑 FIX: This must match the DB column name!
    });

    console.log("✅ Saved to DB:", response.data);
    res.status(200).json({ success: true, message: 'Email sent and saved successfully' });
  } catch (error) {
    console.error('❌ Error:', error); // 👈 This is not detailed enough

    if (error.response) {
        console.error('🔴 Response Error:', error.response.data); // Log API response error
    } else if (error.request) {
        console.error('🟠 Request Error:', error.request); // Log if the request failed
    } else {
        console.error('⚠️ General Error:', error.message); // Log any other errors
    }

    res.status(500).json({ error: 'Failed to send email or save to database', details: error.message });
}

});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
