// backend/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quizapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('[DB] MySQL Pool created and ready.');

export default pool;