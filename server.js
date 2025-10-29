const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- CORS Configuration (The Fix) ---
// Define all domains allowed to access this API.
// 1. http://localhost:4200 (For local Angular development)
// 2. https://[YOUR-ANGULAR-FRONTEND-URL] (Your live Render static site)
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

// Database connection using Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for connecting to PostgreSQL on platforms like Render
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to query the database
async function query(sql) {
  try {
    const client = await pool.connect();
    const result = await client.query(sql);
    client.release();
    return result.rows;
  } catch (err) {
    console.error('Database Query Error:', err);
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
    res.status(500).json({ error: 'Failed to fetch customers.' });
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
    res.status(500).json({ error: 'Failed to fetch accounts.' });
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
    res.status(500).json({ error: 'Failed to fetch transactions.' });
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
