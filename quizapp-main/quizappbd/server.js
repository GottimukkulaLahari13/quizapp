// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js'; // Import the database pool from db.js
import setupRoutes from './routes/index.js'; // Import the new routes setup function

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;
// Use environment variable for SECRET_KEY, with a fallback for development/testing
const SECRET_KEY = process.env.SECRET_KEY || "YOUR_STRONG_SECRET_KEY"; // IMPORTANT: Change this to a strong, random key in production .env

app.use(cors()); // Enable All CORS Requests
app.use(express.json()); // Enable JSON body parsing for incoming requests

// Database Connection Check
db.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database (via imported pool)!');
        connection.release(); // Release the connection back to the pool immediately after checking
    })
    .catch(err => {
        console.error('Error connecting to the database (via imported pool):', err.message);
        process.exit(1); // Exit the process if database connection fails, as the app cannot function without it
    });

// Setup all routes by passing the app instance, db pool, and SECRET_KEY
// This function from routes/index.js will attach all the API endpoints to our Express app
setupRoutes(app, db, SECRET_KEY);

// Catch-all for undefined routes - This middleware should always be placed LAST
app.use((req, res, next) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 Not Found</title>
            <style>
                body {
                    font-family: sans-serif;
                    text-align: center;
                    padding-top: 50px;
                    background-color: #f4f4f4;
                    color: #333;
                }
                h1 {
                    color: #dc3545; /* A reddish color for error */
                    font-size: 2.5em;
                    margin-bottom: 10px;
                }
                p {
                    font-size: 1.2em;
                    color: #6c757d;
                }
            </style>
        </head>
        <body>
            <h1>404 Not Found</h1>
            <p>The requested URL was not found on this server.</p>
            <p>Please check the address and try again.</p>
        </body>
        </html>
    `);
});

// Start the Express server and listen for incoming requests
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
