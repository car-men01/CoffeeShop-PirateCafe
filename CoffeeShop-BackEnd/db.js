const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'postgres',     // your database username
  host: 'localhost',    // database host
  database: 'coffeeshop', // your database name that's already created
  password: 'Bcarmen933!', // your database password
  port: 5432,           // default PostgreSQL port
});

// Test connection
pool.on('connect', () => {
  console.log('PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

module.exports = pool;