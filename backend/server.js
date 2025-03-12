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
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message, attachments } = req.body;
  console.log("📤 Incoming request from frontend:", {
    recipient,
    subject,
    messageLength: message ? message.length : 0,
    attachmentsCount: attachments ? attachments.length : 0
  });

  // Validate recipient email(s)
  const recipientsArray = recipient
    ? recipient.split(',').map(email => email.trim())
    : [];

  if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
    console.log("❌ Invalid recipient email");
    return res.status(400).json({ error: 'Invalid recipient email(s)' });
  }

  // Prepare the email
  const msg = {
    to: recipientsArray,
    from: 'deividaslitvinenko4@gmail.com',
    subject,
    text: message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    html: message,
  };

  // Add attachments if they exist
  if (attachments && attachments.length > 0) {
    console.log(`📎 Processing ${attachments.length} attachments`);
    
    msg.attachments = attachments.map(attachment => ({
      content: attachment.content,
      filename: attachment.filename,
      type: attachment.type,
      disposition: attachment.disposition || 'attachment',
      content_id: attachment.content_id ? 
        (attachment.content_id.startsWith('<') ? attachment.content_id : `<${attachment.content_id}>`) : 
        undefined
    }));
  }

  try {
    // Send email via SendGrid
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");

    // Prepare attachment names for database if they exist
    const attachmentNames = attachments && attachments.length > 0
      ? attachments.map(a => a.filename).join(', ')
      : null;

    // Check if attachments column exists in messages table
    try {
      const columnCheckResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='attachments'
      `);
      
      // If attachments column doesn't exist, add it
      if (columnCheckResult.rows.length === 0) {
        console.log("⚙️ Adding attachments column to messages table");
        await client.query('ALTER TABLE messages ADD COLUMN attachments TEXT');
      }
    } catch (schemaError) {
      console.warn("⚠️ Unable to check/update schema:", schemaError.message);
      // Continue anyway - we'll try to insert without the attachments column
    }

    // Insert into database with or without attachments
    let dbResult;
    try {
      dbResult = await client.query(
        'INSERT INTO messages (subject, description, recipient_email, attachments) VALUES ($1, $2, $3, $4) RETURNING *',
        [subject, message, recipient, attachmentNames]
      );
    } catch (insertError) {
      // If the insert fails (possibly due to missing attachments column), try without it
      if (insertError.message.includes('attachments')) {
        console.warn("⚠️ Falling back to insert without attachments column");
        dbResult = await client.query(
          'INSERT INTO messages (subject, description, recipient_email) VALUES ($1, $2, $3) RETURNING *',
          [subject, message, recipient]
        );
      } else {
        throw insertError; // Re-throw if it's not related to the attachments column
      }
    }
    
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