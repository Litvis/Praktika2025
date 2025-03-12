import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import pkg from 'pg';
import './auth/google.js'; // Ensure Google OAuth strategy is imported
import authRoutes from './routes/OAuth.js'; // Import OAuth routes
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import multer from 'multer'; // For handling multipart/form-data (file uploads)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for larger payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename using timestamp and original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Create multer instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Set up SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Set up PostgreSQL client
const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect();

// Handle JSON payload emails (with base64 attachments)
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message, attachments } = req.body;
  console.log("📤 Incoming JSON request from frontend");

  try {
    // Validate recipient email(s)
    const recipientsArray = recipient
      ? recipient.split(',').map(email => email.trim())
      : [];

    if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
      console.log("❌ Invalid recipient email");
      return res.status(400).json({ error: 'Invalid recipient email(s)' });
    }

    // Prepare email data
    const msg = {
      to: recipientsArray,
      from: 'deividaslitvinenko4@gmail.com',
      subject,
      text: message.replace(/<[^>]*>/g, ''), // Create plain text version by removing HTML tags
      html: message,
    };

    // Add attachments if they exist
    if (attachments && attachments.length > 0) {
      msg.attachments = attachments.map(attachment => ({
        content: attachment.content, // Base64 content
        filename: attachment.filename,
        type: attachment.type,
        disposition: attachment.disposition || 'attachment',
        content_id: attachment.content_id ? `<${attachment.content_id}>` : undefined
      }));
    }

    // Send email via SendGrid
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");

    // Prepare attachment filenames for database storage
    const attachmentNames = attachments 
      ? attachments.map(a => a.filename).join(', ') 
      : null;

    // Save the email data to the database
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

// Alternative multipart form-data approach for file uploads
app.post('/send-email-multipart', upload.array('files', 10), async (req, res) => {
  try {
    const { recipient, subject, message } = req.body;
    console.log("📤 Incoming multipart request from frontend");

    // Validate recipient email(s)
    const recipientsArray = recipient
      ? recipient.split(',').map(email => email.trim())
      : [];

    if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
      console.log("❌ Invalid recipient email");
      return res.status(400).json({ error: 'Invalid recipient email(s)' });
    }

    // Prepare email data
    const msg = {
      to: recipientsArray,
      from: 'deividaslitvinenko4@gmail.com',
      subject,
      text: message.replace(/<[^>]*>/g, ''),
      html: message,
    };

    // Add attachments if files were uploaded
    if (req.files && req.files.length > 0) {
      msg.attachments = await Promise.all(req.files.map(async (file) => {
        // Read file from disk
        const content = fs.readFileSync(file.path).toString('base64');
        
        // Determine if this is inline or regular attachment
        const isInline = file.mimetype.startsWith('image/') && 
                        req.body.inlineImages && 
                        req.body.inlineImages.includes(file.filename);
        
        return {
          content: content,
          filename: file.originalname,
          type: file.mimetype,
          disposition: isInline ? 'inline' : 'attachment',
          content_id: isInline ? `<${path.parse(file.originalname).name}>` : undefined
        };
      }));
    }

    // Send email via SendGrid
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");

    // Cleanup uploaded files after sending
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }

    // Prepare attachment filenames for database storage
    const attachmentNames = req.files 
      ? req.files.map(file => file.originalname).join(', ') 
      : null;

    // Save the email data to the database
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

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(authRoutes);

// Update the database schema to include attachments column
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});