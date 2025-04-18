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
import userManagementRoutes from './middleware/userManagement.js';
import csvImportRoutes from './routes/csvImportRoutes.js';
import { sendEmail } from './utils/sendEmail.js';

dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app FIRST
const app = express();

// Set up PostgreSQL connection pool
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Configure session store
const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// JSON and URL-encoded body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.set('trust proxy', 1);

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your_fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true',
    httpOnly: true,
    sameSite: 'none' // Critical for cross-domain requests
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(googleAuthRouter);
app.use(authRoutes);
app.use(userManagementRoutes);
app.use(csvImportRoutes);

const FRONTEND_URL = process.env.FRONTEND_URL;


app.locals.config = {
  FRONTEND_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_VERSION: process.env.API_VERSION || 'v1',
};

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

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Function to ensure users table exists
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



// In server.js
app.get('/api/check-auth', (req, res) => {
  console.log('Session data:', req.session);
  console.log('User data:', req.user);
  console.log('Is authenticated:', req.isAuthenticated());
  
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

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

// Atnaujintas maršrutas email siuntimui su vartotojo informacija iš sesijos
app.post('/send-email', async (req, res) => {
  const { recipient, subject, message, attachments } = req.body;
  console.log("📤 Incoming JSON request from frontend");
  console.log("Recipients count:", recipient ? recipient.split(',').length : 0);

  try {
    // Gauname vartotojo informaciją iš sesijos
    const userInfo = {
      email: null,
      name: null
    };
    
    // Jei vartotojas prisijungęs, išgauname jo informaciją
    if (req.isAuthenticated() && req.user) {
      // Išgauname el. paštą - bandome iš kelių galimų šaltinių
      if (req.user.emails && req.user.emails.length > 0) {
        userInfo.email = req.user.emails[0].value;
      } else if (req.user.email) {
        userInfo.email = req.user.email;
      }
      
      // Išgauname vardą - bandome iš kelių galimų šaltinių
      if (req.user.displayName) {
        userInfo.name = req.user.displayName;
      } else if (req.user.name) {
        if (typeof req.user.name === 'object' && (req.user.name.givenName || req.user.name.familyName)) {
          // Jei vardas yra objektas su givenName ir familyName
          const parts = [];
          if (req.user.name.givenName) parts.push(req.user.name.givenName);
          if (req.user.name.familyName) parts.push(req.user.name.familyName);
          userInfo.name = parts.join(' ');
        } else if (typeof req.user.name === 'string') {
          // Jei vardas yra tiesiog string
          userInfo.name = req.user.name;
        }
      }
    }
    
    console.log("👤 User info from session:", userInfo);

    // Send email using the updated function with user info
    const emailResult = await sendEmail(
      recipient, 
      subject, 
      message, 
      attachments,
      req.app.locals.config,
      userInfo.email,
      userInfo.name
    );
    
    // Gauname siuntėjo informaciją iš emailResult
    const senderInfo = emailResult.senderInfo || {
      email: userInfo.email || process.env.EMAIL_SENDER || 'deividaslitvinenko4@gmail.com',
      name: userInfo.name || process.env.EMAIL_SENDER_NAME || 'Užimtumo tarnyba'
    };
    
    // Save the email data to the database with sender info
    const attachmentNames = attachments 
      ? attachments.map(a => a.filename).join(', ') 
      : null;

    const dbResult = await pool.query(
      'INSERT INTO messages (subject, description, recipient_email, attachments, sender_email, sender_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [subject, message, recipient, attachmentNames, senderInfo.email, senderInfo.name]
    );
    console.log("✅ Saved to DB:", dbResult.rows[0]);

    // Respond with success message
    res.status(200).json({ 
      success: true, 
      message: 'Email sent and saved successfully',
      statusCode: emailResult.results[0]?.statusCode || 200
    });
  } catch (error) {
    // Enhanced error logging
    console.error('❌ Error sending email:');
    console.error('Error details:', error);
    
    // Return meaningful error to client
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message || 'Unknown error',
      sendGridError: error.sendGridError || null
    });
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
    
    // BŪTINAI PAKEISTI EL. PAŠTO ADRESĄ!!!!!!
    await pool.query(`
      INSERT INTO users (email, name, role) VALUES 
      ('administratorius@gmail.com', 'Admin User', 'admin')
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

app.get('/api/emails/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    
    // Tikrinti ar stulpeliai egzistuoja
    const checkEmailColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='sender_email'
    `);
    
    const checkNameColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='sender_name'
    `);
    
    const hasSenderEmail = checkEmailColumn.rows.length > 0;
    const hasSenderName = checkNameColumn.rows.length > 0;
    
    // Modifikuoti užklausą pagal esamus stulpelius
    let query = `
      SELECT id, subject, description, created_at, recipient_email, attachments
      ${hasSenderEmail ? ', sender_email' : ''}
      ${hasSenderName ? ', sender_name' : ''}
      FROM messages 
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Pridedame paieškos sąlygą, jei pateiktas paieškos terminas
    if (search) {
      let searchQuery = ` AND (
        LOWER(subject) LIKE LOWER($${queryParams.length + 1}) OR 
        LOWER(description) LIKE LOWER($${queryParams.length + 1}) OR 
        LOWER(recipient_email) LIKE LOWER($${queryParams.length + 1})`;
      
      if (hasSenderEmail) {
        searchQuery += ` OR LOWER(sender_email) LIKE LOWER($${queryParams.length + 1})`;
      }
      
      if (hasSenderName) {
        searchQuery += ` OR LOWER(sender_name) LIKE LOWER($${queryParams.length + 1})`;
      }
      
      searchQuery += `)`;
      query += searchQuery;
      queryParams.push(`%${search}%`);
    }
    
    // Pridedame rikiavimą ir puslapių padalinimą
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    // Gauname filtruotus el. laiškus
    const emailsResult = await pool.query(query, queryParams);
    
    // Pridedame trūkstamus laukus, jei jų nėra duomenų bazėje
    const emails = emailsResult.rows.map(row => ({
      ...row,
      sender_email: row.sender_email || 'deividaslitvinenko4@gmail.com',
      sender_name: row.sender_name || 'Sistema'
    }));
    
    // Gauname bendrą skaičių filtruotiems rezultatams
    let countQuery = `
      SELECT COUNT(*) 
      FROM messages 
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (search) {
      let searchCountQuery = ` AND (
        LOWER(subject) LIKE LOWER($${countParams.length + 1}) OR 
        LOWER(description) LIKE LOWER($${countParams.length + 1}) OR 
        LOWER(recipient_email) LIKE LOWER($${countParams.length + 1})`;
      
      if (hasSenderEmail) {
        searchCountQuery += ` OR LOWER(sender_email) LIKE LOWER($${countParams.length + 1})`;
      }
      
      if (hasSenderName) {
        searchCountQuery += ` OR LOWER(sender_name) LIKE LOWER($${countParams.length + 1})`;
      }
      
      searchCountQuery += `)`;
      countQuery += searchCountQuery;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      success: true,
      data: {
        emails: emails,
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

app.get('/setup-sender-fields', async (req, res) => {
  try {
    // Patikriname, ar jau egzistuoja sender_email stulpelis
    const checkEmailResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='sender_email'
    `);
    
    // Patikriname, ar jau egzistuoja sender_name stulpelis
    const checkNameResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='sender_name'
    `);
    
    // Pradedame transakciją
    await pool.query('BEGIN');
    
    let changes = [];
    
    // Jei sender_email stulpelio nėra, pridedame jį
    if (checkEmailResult.rows.length === 0) {
      await pool.query(
        'ALTER TABLE messages ADD COLUMN sender_email TEXT DEFAULT \'deividaslitvinenko4@gmail.com\''
      );
      changes.push('Added sender_email column');
    }
    
    // Jei sender_name stulpelio nėra, pridedame jį
    if (checkNameResult.rows.length === 0) {
      await pool.query(
        'ALTER TABLE messages ADD COLUMN sender_name TEXT DEFAULT \'Sistema\''
      );
      changes.push('Added sender_name column');
    }
    
    // Atnaujiname esamus įrašus numatytaisiais duomenimis, jei buvo atlikti pakeitimai
    if (changes.length > 0) {
      await pool.query(
        'UPDATE messages SET sender_email = $1, sender_name = $2 WHERE sender_email IS NULL OR sender_name IS NULL',
        [process.env.EMAIL_SENDER || 'deividaslitvinenko4@gmail.com', 'Sistema']
      );
      changes.push('Updated existing records');
    }
    
    // Patvirtinti pakeitimus
    await pool.query('COMMIT');
    
    res.status(200).json({ 
      success: true, 
      message: changes.length > 0 
        ? `Database updated: ${changes.join(', ')}` 
        : 'No changes needed, schema already up to date' 
    });
  } catch (error) {
    // Atšaukti pakeitimus klaidos atveju
    await pool.query('ROLLBACK');
    console.error('❌ Error updating schema for sender fields:', error);
    res.status(500).json({ error: 'Failed to update database schema', details: error.message });
  }
});

// Endpoint to get a specific email by ID
app.get('/api/emails/:id', async (req, res) => {
  try {
    const emailId = req.params.id;
    
    // Tikrinti ar stulpeliai egzistuoja
    const checkEmailColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='sender_email'
    `);
    
    const checkNameColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='sender_name'
    `);
    
    const hasSenderEmail = checkEmailColumn.rows.length > 0;
    const hasSenderName = checkNameColumn.rows.length > 0;
    
    // Modifikuoti užklausą pagal esamus stulpelius
    let query = `
      SELECT id, subject, description, created_at, recipient_email, attachments
      ${hasSenderEmail ? ', sender_email' : ''}
      ${hasSenderName ? ', sender_name' : ''}
      FROM messages 
      WHERE id = $1
    `;
    
    const emailResult = await pool.query(query, [emailId]);
    
    if (emailResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Pridedame trūkstamus laukus, jei jų nėra duomenų bazėje
    const email = {
      ...emailResult.rows[0],
      sender_email: emailResult.rows[0].sender_email || 'deividaslitvinenko4@gmail.com',
      sender_name: emailResult.rows[0].sender_name || 'Sistema'
    };
    
    res.status(200).json({
      success: true,
      data: email
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

// Atnaujintas multipart form-data kelias el. laiško siuntimui
app.post('/send-email-multipart', upload.array('files', 10), async (req, res) => {
  try {
    const { recipient, subject, message } = req.body;
    console.log("📤 Incoming multipart request from frontend");

    // Gauname vartotojo informaciją iš sesijos
    const userInfo = {
      email: null,
      name: null
    };
    
    // Jei vartotojas prisijungęs, išgauname jo informaciją
    if (req.isAuthenticated() && req.user) {
      // Išgauname el. paštą - bandome iš kelių galimų šaltinių
      if (req.user.emails && req.user.emails.length > 0) {
        userInfo.email = req.user.emails[0].value;
      } else if (req.user.email) {
        userInfo.email = req.user.email;
      }
      
      // Išgauname vardą - bandome iš kelių galimų šaltinių
      if (req.user.displayName) {
        userInfo.name = req.user.displayName;
      } else if (req.user.name) {
        if (typeof req.user.name === 'object' && (req.user.name.givenName || req.user.name.familyName)) {
          const parts = [];
          if (req.user.name.givenName) parts.push(req.user.name.givenName);
          if (req.user.name.familyName) parts.push(req.user.name.familyName);
          userInfo.name = parts.join(' ');
        } else if (typeof req.user.name === 'string') {
          userInfo.name = req.user.name;
        }
      }
    }
    
    console.log("👤 User info from session:", userInfo);

    // Validate recipient email(s)
    const recipientsArray = recipient
      ? recipient.split(',').map(email => email.trim())
      : [];

    if (recipientsArray.length === 0 || recipientsArray.some(email => !email.includes('@'))) {
      console.log("❌ Invalid recipient email");
      return res.status(400).json({ error: 'Invalid recipient email(s)' });
    }

    // Nustatome siuntėjo informaciją iš vartotojo duomenų arba naudojame numatytuosius
    const senderEmail = userInfo.email || process.env.EMAIL_SENDER || 'deividaslitvinenko4@gmail.com';
    const senderName = userInfo.name || process.env.EMAIL_SENDER_NAME || 'Užimtumo tarnyba';

    const personalizations = recipientsArray.map(email => ({
      to: [{ email }],
      subject: subject
    }));
    
    const msg = {
      personalizations: personalizations,
      from: {
        email: senderEmail,
        name: senderName
      },
      content: [
        {
          type: 'text/plain',
          value: message.replace(/<[^>]*>/g, '')
        },
        {
          type: 'text/html',
          value: message
        }
      ]
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

    // Save the email data to the database with sender information
    const dbResult = await pool.query(
      'INSERT INTO messages (subject, description, recipient_email, attachments, sender_email, sender_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [subject, message, recipient, attachmentNames, senderEmail, senderName]
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
      // Create messages table if it doesn't exist with sender columns
      await pool.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          subject TEXT,
          description TEXT,
          recipient_email TEXT,
          attachments TEXT,
          sender_email TEXT DEFAULT 'deividaslitvinenko4@gmail.com',
          sender_name TEXT DEFAULT 'Sistema',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      res.status(200).json({ success: true, message: 'Messages table created successfully with sender fields' });
    } else {
      // Table exists, check if it has the sender columns
      const checkEmailColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='sender_email'
      `);
      
      const checkNameColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='sender_name'
      `);
      
      let changes = [];
      
      // Add missing columns if needed
      if (checkEmailColumn.rows.length === 0) {
        await pool.query(`
          ALTER TABLE messages 
          ADD COLUMN sender_email TEXT DEFAULT 'deividaslitvinenko4@gmail.com';
        `);
        changes.push('Added sender_email column');
      }
      
      if (checkNameColumn.rows.length === 0) {
        await pool.query(`
          ALTER TABLE messages 
          ADD COLUMN sender_name TEXT DEFAULT 'Sistema';
        `);
        changes.push('Added sender_name column');
      }
      
      // Update existing records if columns were added
      if (changes.length > 0) {
        await pool.query(`
          UPDATE messages 
          SET sender_email = 'deividaslitvinenko4@gmail.com', sender_name = 'Sistema' 
          WHERE sender_email IS NULL OR sender_name IS NULL;
        `);
        changes.push('Updated existing records');
      }
      
      if (changes.length > 0) {
        res.status(200).json({ 
          success: true, 
          message: `Messages table updated: ${changes.join(', ')}` 
        });
      } else {
        res.status(200).json({ 
          success: true, 
          message: 'Messages table already exists with all required columns' 
        });
      }
    }
  } catch (error) {
    console.error('❌ Error setting up messages table:', error);
    res.status(500).json({ error: 'Failed to set up messages table', details: error.message });
  }
});

async function setupMessagesTable() {
  try {
    console.log('Checking for messages table and required columns...');
    
    // Patikriname, ar egzistuoja messages lentelė
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'messages'
      );
    `);
    
    if (!checkTableResult.rows[0].exists) {
      // Sukuriame lentelę, jei jos nėra
      console.log('Creating messages table with all required columns...');
      await pool.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          subject TEXT,
          description TEXT,
          recipient_email TEXT,
          attachments TEXT,
          sender_email TEXT DEFAULT 'deividaslitvinenko4@gmail.com',
          sender_name TEXT DEFAULT 'Sistema',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Messages table created successfully with sender fields');
    } else {
      // Patikriname, ar yra reikalingi stulpeliai
      const checkEmailColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='sender_email'
      `);
      
      const checkNameColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='sender_name'
      `);
      
      // Pridedame trūkstamus stulpelius
      if (checkEmailColumn.rows.length === 0) {
        console.log('Adding sender_email column to messages table...');
        await pool.query(`
          ALTER TABLE messages 
          ADD COLUMN sender_email TEXT DEFAULT 'deividaslitvinenko4@gmail.com';
        `);
      }
      
      if (checkNameColumn.rows.length === 0) {
        console.log('Adding sender_name column to messages table...');
        await pool.query(`
          ALTER TABLE messages 
          ADD COLUMN sender_name TEXT DEFAULT 'Sistema';
        `);
      }
      
      // Atnaujiname senus įrašus, jei yra stulpelių be reikšmių
      if (checkEmailColumn.rows.length === 0 || checkNameColumn.rows.length === 0) {
        console.log('Updating existing records with default sender values...');
        await pool.query(`
          UPDATE messages 
          SET 
            sender_email = COALESCE(sender_email, 'deividaslitvinenko4@gmail.com'),
            sender_name = COALESCE(sender_name, 'Sistema')
          WHERE sender_email IS NULL OR sender_name IS NULL;
        `);
      }
      
      console.log('Messages table structure verified and updated if needed');
    }
  } catch (error) {
    console.error('❌ Error setting up messages table:', error);
    throw error;
  }
}


// Atnaujinta startServer funkcija
async function startServer() {
  try {
    // Ensure tables exist first
    await ensureSessionTableExists();
    await ensureUsersTableExists();
    await setupMessagesTable(); // Pridėtas naujas kvietimas

    console.log('CORS origin configuration:', process.env.FRONTEND_URL);
    console.log('Full CORS configuration:', {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    });

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

// Export pool and app for other parts of the application
export { pool, app };