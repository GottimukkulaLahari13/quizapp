const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('[DB] MySQL connection failed:', err.message);
    throw err;
  }
  console.log('[DB] Connected to MySQL');
});

module.exports = connection;
