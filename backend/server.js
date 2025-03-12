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

// Updated /send-email endpoint to handle attachments
// Add this logging to your backend
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message, attachments } = req.body;
  
  console.log("📧 Processing email request");
  console.log("- Subject:", subject);
  console.log("- Recipient:", recipient);

  try {
    // Validate recipient email(s)
    const recipientsArray = recipient
      ? recipient.split(',').map(email => email.trim())
      : [];

    if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
      console.log("❌ Invalid recipient email");
      return res.status(400).json({ error: 'Invalid recipient email(s)' });
    }

    // Prepare base email object
    const msg = {
      to: recipientsArray,
      from: 'deividaslitvinenko4@gmail.com',
      subject,
      text: message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: message,
    };
    
    // Process attachments if they exist
    if (attachments && attachments.length > 0) {
      console.log("- Attachment details:");
      attachments.forEach((attachment, index) => {
        console.log(`  [${index}] ${attachment.filename}, ${attachment.type}, ${attachment.disposition}, content_id: ${attachment.content_id}`);
      });
      
// In your send-email endpoint:
// Format the attachments correctly for SendGrid
msg.attachments = attachments.map(attachment => {
  const contentId = attachment.content_id;
  
  // For inline attachments, make sure content_id has angle brackets
  // but don't duplicate them if they're already there
  const formattedContentId = attachment.disposition === 'inline' 
    ? (contentId.startsWith('<') ? contentId : `<${contentId}>`)
    : contentId;
  
  return {
    content: attachment.content,
    filename: attachment.filename,
    type: attachment.type,
    disposition: attachment.disposition || 'attachment',
    content_id: formattedContentId
  };
});
      
      console.log("- Formatted attachment content_ids:");
      msg.attachments.forEach((att, i) => {
        console.log(`  [${i}] content_id: ${att.content_id}`);
      });
    }
    
    // Send email via SendGrid
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");

    // Save the email data to the database
    const attachmentNames = attachments && attachments.length > 0
      ? attachments.map(a => a.filename).join(', ')
      : null;
      
    const dbResult = await client.query(
      'INSERT INTO messages (subject, description, recipient_email, attachments) VALUES ($1, $2, $3, $4) RETURNING *',
      [subject, message, recipient, attachmentNames]
    );
    console.log("✅ Saved to DB:", dbResult.rows[0]);

    // Respond with success message
    res.status(200).json({ success: true, message: 'Email sent and saved successfully' });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to send email or save to database', details: error.message });
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