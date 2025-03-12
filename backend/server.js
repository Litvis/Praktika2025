import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import pkg from 'pg';
import './auth/google.js'; // Ensure Google OAuth strategy is imported
import authRoutes from './routes/OAuth.js'; // Import OAuth routes
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
// Increase JSON limit for file attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Set up PostgreSQL client
const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect();

const processImagesForEmail = (htmlContent) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const images = tempDiv.querySelectorAll('img');
  
  images.forEach((img) => {
    // Ensure the image is a base64 data URL
    if (img.src.startsWith('data:image')) {
      // No further processing needed - base64 images work directly in emails
    }
  });
  
  return tempDiv.innerHTML;
};

// Updated /send-email endpoint to handle attachments
// Add this logging to your backend
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message } = req.body;
  
  try {
    const msg = {
      to: recipient,
      from: 'deividaslitvinenko4@gmail.com', // Your verified SendGrid sender email
      subject,
      html: message  // Directly use the HTML with base64 image
    };
    
    await sgMail.send(msg);
    
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database schema setup endpoint (optional - will be automatically handled by send-email)
app.get('/setup-db', async (req, res) => {
  try {
    // Check if the attachments column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='attachments'
    `);
    
    // If the column doesn't exist, add it
    if (checkResult.rows.length === 0) {
      await client.query(
        'ALTER TABLE messages ADD COLUMN attachments TEXT'
      );
      res.status(200).json({ success: true, message: 'Database schema updated successfully' });
    } else {
      res.status(200).json({ success: true, message: 'Database schema already up to date' });
    }
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    res.status(500).json({ error: 'Failed to update database schema', details: error.message });
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret_replace_in_production',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});