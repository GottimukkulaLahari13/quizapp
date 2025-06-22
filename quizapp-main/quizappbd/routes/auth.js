// backend/routes/auth.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db.js';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
router.post('/register', upload, async (req, res) => {
    try {
        const { fullName, email, phone, collegeName, collegeID } = req.body;
        const profilePic = req.files?.profilePic?.[0];
        const idCard = req.files?.idCard?.[0];

        if (!fullName || !email || !phone || !collegeName || !collegeID) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (!profilePic) {
            return res.status(400).json({ error: 'Profile picture is required.' });
        }
        if (!idCard) {
            return res.status(400).json({ error: 'College ID card is required.' });
        }

        // Check if user already exists
        const [existingUsers] = await db.query('SELECT email FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Generate and hash a random password
        const randomPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, phone, college_name, college_id, profile_pic, id_card, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [fullName, email, hashedPassword, phone, collegeName, collegeID, profilePic.filename, idCard.filename]
        );

        // Try to send email, but don't fail registration if email fails
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await transporter.sendMail({
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
                });
                res.status(201).json({ message: 'Registration successful. Please check your email for the password.' });
            } else {
                // Email configuration missing, but registration succeeded
                res.status(201).json({ 
                    message: `Registration successful! Your temporary password is: ${randomPassword}. Please save this password and change it after login.`,
                    password: randomPassword // Include password in response for development
                });
            }
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Registration succeeded but email failed
            res.status(201).json({ 
                message: `Registration successful! Your temporary password is: ${randomPassword}. Please save this password and change it after login.`,
                password: randomPassword // Include password in response for development
            });
        }
    } catch (error) {
        console.error('REGISTRATION_ERROR:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// --- Login Route ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                profilePic: user.profile_pic,
            },
        });
    } catch (error) {
        console.error('LOGIN_ERROR:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// --- User Profile Route ---
router.get('/user/:id/profile', async (req, res) => {
    try {
        const userId = req.params.id;
        const [rows] = await db.query(
            'SELECT id, full_name, email, phone, college_name, college_id, profile_pic, id_card, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        res.json({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            college_name: user.college_name,
            college_id: user.college_id,
            profile_pic: user.profile_pic,
            id_card: user.id_card,
            created_at: user.created_at
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// --- Forgot Password Route (send new password directly) ---
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });
        // Check if user exists
        const [users] = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'No user found with that email.' });
        }
        const user = users[0];
        // Generate new random password
        const newPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Update password in database
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        // Try to send new password via email
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await transporter.sendMail({
                    from: `"nDMatrix Team" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Your New Password',
                    html: `<p>Dear ${user.full_name},</p>
                           <p>Your password has been reset. Here is your new password:</p>
                           <h2>${newPassword}</h2>
                           <p>Please log in and change your password immediately.</p>
                           <p>If you did not request this, please contact support.</p>`
                });
                res.json({ message: 'A new password has been sent to your email.' });
            } else {
                // Email configuration missing, but password reset succeeded
                res.json({ 
                    message: `Password reset successful! Your new password is: ${newPassword}. Please save this password and change it after login.`,
                    password: newPassword // Include password in response for development
                });
            }
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Password reset succeeded but email failed
            res.json({ 
                message: `Password reset successful! Your new password is: ${newPassword}. Please save this password and change it after login.`,
                password: newPassword // Include password in response for development
            });
        }
    } catch (error) {
        console.error('FORGOT_PASSWORD_ERROR:', error);
        res.status(500).json({ message: 'Failed to send new password. Please try again.' });
    }
});

// --- Reset Password Route ---
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required.' });
        // Find user with valid token
        const [users] = await db.query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }
        const userId = users[0].id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Update password and clear token fields
        await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, userId]);
        res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('RESET_PASSWORD_ERROR:', error);
        res.status(500).json({ message: 'Failed to reset password. Please try again.' });
    }
});

export default router;