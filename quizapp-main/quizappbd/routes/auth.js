const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');  // your DB connection
const router = express.Router();
require("dotenv").config();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 512000 }, // max 500KB per file
}).fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'idCard', maxCount: 1 },
]);

router.post('/register', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const { fullName, email, phone, collegeName, collegeID } = req.body;
      const profilePic = req.files?.profilePic?.[0];
      const idCard = req.files?.idCard?.[0];

      // Validate required files and size ranges
      if (!profilePic || profilePic.size < 51200 || profilePic.size > 256000) {
        return res.status(400).json({
          error: 'Profile Picture must be between 50KB and 250KB.',
        });
      }
      if (!idCard || idCard.size < 102400 || idCard.size > 512000) {
        return res.status(400).json({
          error: 'College ID Card must be between 100KB and 500KB.',
        });
      }

      // Check if user already exists
      const [existingUser] = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists.' });
      }

      // Generate random password & hash it
      const randomPassword = crypto.randomBytes(4).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Insert user into DB
      await new Promise((resolve, reject) => {
        const sql =
          'INSERT INTO users (full_name, email, password, phone, college_name, college_id, profile_pic, id_card, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        const values = [
          fullName,
          email,
          hashedPassword,
          phone,
          collegeName,
          collegeID,
          profilePic.filename,
          idCard.filename,
        ];

        db.query(sql, values, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Registration Successful - Your Password',
        html: `
          <p>Dear ${fullName},</p>
          <p>You have successfully registered.</p>
          <p><strong>Your Password:</strong> ${randomPassword}</p>
          <p>Use it to <a href="http://localhost:5173/login">Login here</a>.</p>
          <br>
          <p>Best Regards,<br/>nDMatrix Team</p>
        `,
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        message: 'Registration successful. Check your email for password.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  });
});

module.exports = router;
