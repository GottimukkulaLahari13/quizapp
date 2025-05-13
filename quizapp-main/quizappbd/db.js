const mysql = require('mysql');
require('dotenv').config();

console.log('[DB] Starting database connection setup...');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // or your actual MySQL password
  database: 'quizapp' // replace with your DB name
});

connection.connect((err) => {
  if (err) {
    console.error('[DB] MySQL connection failed:', err.message);
    throw err;
  }
  console.log('[DB] Connected to MySQL');
});

module.exports = connection;
