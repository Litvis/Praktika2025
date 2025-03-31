import express from 'express';
import sgMail from '@sendgrid/mail';
import cors from 'cors';
import pkg from 'pg';
import './auth/google.js'; // Ensure Google OAuth strategy is imported
import authRoutes from './routes/OAuth.js'; // Import OAuth routes
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import dotenv from 'dotenv';
import multer from 'multer'; // For handling multipart/form-data (file uploads)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import googleAuthRouter from './auth/google.js';

dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(googleAuthRouter);
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

// Set up PostgreSQL connection pool instead of a single client
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  // Don't crash the server on connection errors
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('PostgreSQL connected successfully at:', res.rows[0].now);
  }
});

async function ensureUsersTableExists() {
  try {
    console.log('Checking for users table...');
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'worker',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert some initial admin users if needed
      await pool.query(`
        INSERT INTO users (email, name, role) VALUES 
        ('deividaslitvinenko4@gmail.com', 'Admin User', 'admin')
        ON CONFLICT (email) DO NOTHING;
      `);
      
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
    }
  } catch (error) {
    console.error('Error ensuring users table exists:', error);
    throw error;
  }
}

// Function to ensure sessions table exists
async function ensureSessionTableExists() {
  try {
    console.log('Checking for sessions table...');
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      );
    `);
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating sessions table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
        );
        CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
      `);
      console.log('Sessions table created successfully');
    } else {
      console.log('Sessions table already exists');
    }
  } catch (error) {
    console.error('Error ensuring sessions table exists:', error);
  }
}



// Configure session store
const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware BEFORE Passport
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your_fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


sgMail.setApiKey(process.env.SENDGRID_API_KEY);


pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Routes
app.use(googleAuthRouter);
app.use(authRoutes);

async function ensureTablesExist() {
  try {
    // Ensure users table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'worker',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure sessions table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
    `);

    console.log('Tables ensured');
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    throw error;
  }
}

// Add middleware to ensure sessions table exists before processing auth routes
app.use('/auth/*', async (req, res, next) => {
  try {
    await ensureSessionTableExists();
    next();
  } catch (err) {
    console.error('Error checking sessions table before auth:', err);
    next(err);
  }
});

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

    // Save the email data to the database - UPDATED to use pool instead of client
    const dbResult = await pool.query(
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

// Endpoint to create users table if it doesn't exist
app.get('/setup-users-table', async (req, res) => {
  try {
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'worker',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert some initial admin users if needed
    await pool.query(`
      INSERT INTO users (email, name, role) VALUES 
      ('deividaslitvinenko4@gmail.com', 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    
    res.status(200).json({ success: true, message: 'Users table created successfully' });
  } catch (error) {
    console.error('Error creating users table:', error);
    res.status(500).json({ error: 'Failed to create users table', details: error.message });
  }
});

// Add this to your server.js file
app.get('/api/user/profile', (req, res) => {
  if (req.isAuthenticated()) {
    const userInfo = {
      id: req.user.id,
      firstName: req.user.name?.givenName,
      lastName: req.user.name?.familyName,
      displayName: req.user.displayName,
      email: req.user.emails?.[0]?.value,
      avatar: req.user.photos?.[0]?.value,
      role: req.user.role || 'worker'
    };
    
    res.json({ success: true, user: userInfo });
  } else {
    res.status(401).json({ success: false, error: 'Not authenticated' });
  }
});

// Endpoint to get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Get total emails count
    const countResult = await pool.query('SELECT COUNT(*) FROM messages');
    const totalEmails = parseInt(countResult.rows[0].count);
    
    // Get the most recent email
    const lastEmailResult = await pool.query(
      'SELECT id, subject, description, created_at, recipient_email, attachments FROM messages ORDER BY created_at DESC LIMIT 1'
    );
    const lastEmail = lastEmailResult.rows[0] || null;
    
    // Get the count of emails sent in the last 30 days
    const recentCountResult = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL \'30 day\''
    );
    const recentEmails = parseInt(recentCountResult.rows[0].count);
    
    // Return all stats
    res.status(200).json({
      success: true,
      data: {
        totalEmails,
        recentEmails,
        lastEmail
      }
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Endpoint to get recent emails with search
app.get('/api/emails/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    
    // Construct base query with search
    let query = `
      SELECT id, subject, description, created_at, recipient_email, attachments 
      FROM messages 
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add search condition if search term is provided
    if (search) {
      query += ` AND (
        LOWER(subject) LIKE LOWER($${queryParams.length + 1}) OR 
        LOWER(description) LIKE LOWER($${queryParams.length + 1}) OR 
        LOWER(recipient_email) LIKE LOWER($${queryParams.length + 1})
      )`;
      queryParams.push(`%${search}%`);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    // Get filtered emails
    const emailsResult = await pool.query(query, queryParams);
    
    // Get total count for filtered results
    let countQuery = `
      SELECT COUNT(*) 
      FROM messages 
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (
        LOWER(subject) LIKE LOWER($${countParams.length + 1}) OR 
        LOWER(description) LIKE LOWER($${countParams.length + 1}) OR 
        LOWER(recipient_email) LIKE LOWER($${countParams.length + 1})
      )`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      success: true,
      data: {
        emails: emailsResult.rows,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching recent emails:', error);
    res.status(500).json({ error: 'Failed to fetch recent emails', details: error.message });
  }
});

// Endpoint to get a specific email by ID
app.get('/api/emails/:id', async (req, res) => {
  try {
    const emailId = req.params.id;
    
    const emailResult = await pool.query(
      'SELECT id, subject, description, created_at, recipient_email, attachments FROM messages WHERE id = $1',
      [emailId]
    );
    
    if (emailResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.status(200).json({
      success: true,
      data: emailResult.rows[0]
    });
  } catch (error) {
    console.error(`❌ Error fetching email with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch email', details: error.message });
  }
});

// Endpoint to get emails stats by day (for charts)
app.get('/api/emails/stats/daily', async (req, res) => {
  try {
    // Get count of emails sent per day for the last 30 days
    const statsResult = await pool.query(
      `SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count 
      FROM messages 
      WHERE created_at > NOW() - INTERVAL '30 day' 
      GROUP BY DATE(created_at) 
      ORDER BY date ASC`
    );
    
    res.status(200).json({
      success: true,
      data: statsResult.rows
    });
  } catch (error) {
    console.error('❌ Error fetching daily email stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily email stats', details: error.message });
  }
});

// Endpoint to get email recipient distribution (for charts)
app.get('/api/emails/stats/recipients', async (req, res) => {
  try {
    // Get count of emails sent to each recipient
    const statsResult = await pool.query(
      `SELECT 
        recipient_email, 
        COUNT(*) as count 
      FROM messages 
      GROUP BY recipient_email 
      ORDER BY count DESC 
      LIMIT 10`
    );
    
    res.status(200).json({
      success: true,
      data: statsResult.rows
    });
  } catch (error) {
    console.error('❌ Error fetching recipient stats:', error);
    res.status(500).json({ error: 'Failed to fetch recipient stats', details: error.message });
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

    // Save the email data to the database - UPDATED to use pool instead of client
    const dbResult = await pool.query(
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

// Update the database schema to include attachments column - UPDATED to use pool instead of client
app.get('/setup-db', async (req, res) => {
  try {
    // Check if the attachments column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='attachments'
    `);
    
    // If the column doesn't exist, add it
    if (checkResult.rows.length === 0) {
      await pool.query(
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

// Endpoint to check if messages table exists and create it if needed
app.get('/setup-messages', async (req, res) => {
  try {
    // Check if messages table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'messages'
      );
    `);
    
    if (!checkResult.rows[0].exists) {
      // Create messages table if it doesn't exist
      await pool.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          subject TEXT,
          description TEXT,
          recipient_email TEXT,
          attachments TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      res.status(200).json({ success: true, message: 'Messages table created successfully' });
    } else {
      res.status(200).json({ success: true, message: 'Messages table already exists' });
    }
  } catch (error) {
    console.error('❌ Error creating messages table:', error);
    res.status(500).json({ error: 'Failed to create messages table', details: error.message });
  }
});

// Modify server startup
async function startServer() {
  try {
    await ensureSessionTableExists();
    await ensureUsersTableExists();

    // Set up SendGrid 
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export pool for other parts of the application
export { pool };