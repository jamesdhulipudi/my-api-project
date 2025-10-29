const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file (for local use)
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- CORS Configuration (The Fix) ---
// Define all domains allowed to access this API.
const allowedOrigins = [
    'http://localhost:4200',
    'https://dhulipudibank.onrender.com' // <<< IMPORTANT: REPLACE THIS WITH YOUR ACTUAL RENDER FRONTEND URL
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

// Apply CORS Middleware
app.use(cors(corsOptions));
app.use(express.json());

// --- Database Connection Setup (FIXED FOR ROBUST DEPLOYMENT) ---
let connectionString = process.env.DATABASE_URL;

// FALLBACK: If DATABASE_URL is not set, try to construct it from individual variables
// The constructed URL will NOT include the ?sslmode=require parameter, so we handle SSL explicitly below.
if (!connectionString && process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
    console.log("Constructing database connection string from individual DB_* environment variables.");
    connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
}

if (!connectionString) {
    console.error("FATAL ERROR: Database connection failed. DATABASE_URL or individual DB_* variables are not set in the environment.");
}

// Determine SSL requirement for external hosts like Aiven or Render-hosted databases
let sslConfig = false;
// If the connection string contains 'sslmode=require' (from Aiven URI) OR
// if we are running in a production environment (like Render), enable SSL.
if (connectionString && connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production') {
    sslConfig = {
        rejectUnauthorized: false
    };
    console.log("Database SSL configuration enabled.");
}


// Database connection using Pool
const pool = new Pool({
  // Use the connection string (either full URL or constructed)
  connectionString: connectionString,
  // Use the dynamically determined SSL configuration
  ssl: sslConfig
});

// Helper function to query the database
async function query(sql) {
  try {
    const client = await pool.connect();
    const result = await client.query(sql);
    client.release();
    return result.rows;
  } catch (err) {
    // Crucial: Log the exact error received from the database
    console.error('Database Query Error:', err.message || err);
    throw err; // Re-throw the error to be handled by the route
  }
}

// --- API Endpoints ---

// 1. Get All Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await query(`
      SELECT customer_id, first_name, last_name, email, phone_number, address, created_at
      FROM customers;
    `);
    res.json(customers);
  } catch (error) {
    // Provide a more descriptive error status for debugging
    res.status(500).json({ error: 'Failed to fetch customers. Check API service logs for database error details.' });
  }
});

// 2. Get All Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await query(`
      SELECT account_id, customer_id, balance, account_type, created_at
      FROM accounts;
    `);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts. Check API service logs for database error details.' });
  }
});

// 3. Get All Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    // Note: ORDER BY ensures transactions are chronologically sensible
    const transactions = await query(`
      SELECT transaction_id, account_id, amount, transaction_type, transaction_date
      FROM transactions
      ORDER BY transaction_date DESC;
    `);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions. Check API service logs for database error details.' });
  }
});

// Fallback Route
app.get('/', (req, res) => {
  res.send('Bank API is running. Access /api/customers, /api/accounts, or /api/transactions');
});

// Start Server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
