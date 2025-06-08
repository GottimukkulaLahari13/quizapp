// backend/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME, // Make sure this matches your .env file
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool; // Already promise-based

console.log('[DB] MySQL Pool created and ready.');

export default promisePool;