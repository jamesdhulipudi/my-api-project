// --- 1. Import Libraries ---
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // This loads the .env file

// --- 2. Initialize App ---
const app = express();
const port = process.env.PORT || 3001; // Use port 3001 locally

// --- 3. Setup Middleware ---
app.use(cors()); // Allow cross-origin requests (for your frontends)
app.use(express.json()); // Allow app to read JSON in request bodies

// --- 4. Configure Database Connection (CRITICAL) ---
// This pool will use the variables from your .env file
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // Required for Aiven
  }
});

pool.connect()
    .then(client => {
        console.log('Successfully connected to PostgreSQL!');
        client.release(); // Release the client back to the pool
    })
    .catch(err => {
      console.error('***DATABASE CONNECTION FAILED***', err);
      console.error('Check your .env variables (DB_HOST, DB_USER, etc.) and ensure PostgreSQL service is running.');
        // You can exit the app here if the connection is mandatory
        // process.exit(1); 
    });

// --- 5. Define API Endpoints ---

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// GET all Customers
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query('select * from public.customers');
        res.json(result.rows);
    } catch (err) {
        // 🚨 CRITICAL: Use console.error to write to the terminal
        // Log the ENTIRE error object for maximum detail
        console.error('--- DB QUERY FAILED MARKER ---');
        console.error(err); 
        console.error('------------------------------');

        // Send a generic error response to the client
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET all Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Accounts');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Transactions');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- 6. Start The Server ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
