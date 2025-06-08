// backend/routes/auth.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); // Switched to bcryptjs for better compatibility
const crypto = require('crypto');
const db = require('../db'); // This now imports the mysql2 promise pool
const router = express.Router();
require("dotenv").config();

// --- Setup ---
// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 512000 }, // 500KB limit
}).fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
]);

// --- Registration Route ---
// POST /api/auth/register
router.post('/register', upload, async (req, res) => {
    // Note: The `upload` middleware now handles the initial processing.
    // We can directly access req.body and req.files.
    try {
        const { fullName, email, phone, collegeName, collegeID } = req.body;
        const profilePic = req.files?.profilePic?.[0];
        const idCard = req.files?.idCard?.[0];

        // --- Input Validation ---
        if (!fullName || !email || !phone || !collegeName || !collegeID) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (!profilePic) {
            return res.status(400).json({ error: 'Profile picture is required.' });
        }
        if (!idCard) {
            return res.status(400).json({ error: 'College ID card is required.' });
        }
        if (profilePic.size < 51200 || profilePic.size > 256000) {
            return res.status(400).json({ error: 'Profile Picture must be between 50KB and 250KB.' });
        }
        if (idCard.size < 102400 || idCard.size > 512000) {
            return res.status(400).json({ error: 'College ID Card must be between 100KB and 500KB.' });
        }

        // --- Database Logic (using modern async/await) ---
        // Check if user already exists
        const checkUserSql = 'SELECT email FROM users WHERE email = ?';
        const [existingUsers] = await db.query(checkUserSql, [email]);

        if (existingUsers.length > 0) {
            console.log('Registration attempt with existing email:', email);
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Generate and hash a random password
        const randomPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Insert new user into the database
        const insertSql = `
            INSERT INTO users (full_name, email, password, phone, college_name, college_id, profile_pic, id_card, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const values = [fullName, email, hashedPassword, phone, collegeName, collegeID, profilePic.filename, idCard.filename];
        await db.query(insertSql, values);

        // --- Email Logic ---
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Using service is often easier than host/port
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"nDMatrix Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Registration Successful - Your Password',
            html: `
                <p>Dear ${fullName},</p>
                <p>You have successfully registered for the test portal.</p>
                <p><strong>Your one-time password is:</strong> <h1>${randomPassword}</h1></p>
                <p>Please use this password to <a href="http://localhost:5173/login">Login here</a> and change your password immediately.</p>
                <br>
                <p>Best Regards,<br/>The nDMatrix Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Registration email sent successfully to:', email);

        res.status(201).json({ message: 'Registration successful. Please check your email for the password.' });

    } catch (error) {
        // This single catch block handles errors from file upload, database, or email.
        console.error('REGISTRATION_ERROR:', error);
        res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
    }
});


// --- Login Route ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        
        // --- Database Logic (using modern async/await) ---
        const findUserSql = 'SELECT * FROM users WHERE email = ?';
        const [users] = await db.query(findUserSql, [email]);

        // Check if user exists
        if (users.length === 0) {
            console.log('Login failed: User not found for email:', email);
            return res.status(401).json({ error: 'Invalid credentials.' }); // Generic error
        }

        const user = users[0];

        // Compare password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Login failed: Password mismatch for email:', email);
            return res.status(401).json({ error: 'Invalid credentials.' }); // Generic error
        }

        console.log('Login successful for:', email);

        // Send a successful response with user data
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                // The frontend should construct the full URL
                profilePic: user.profile_pic,
            },
        });

    } catch (error) {
        console.error('LOGIN_ERROR:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

module.exports = router;