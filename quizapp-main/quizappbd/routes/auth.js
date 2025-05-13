const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const connection = require('../db.js');
require('dotenv').config();

const router = express.Router();

// Generate random password
function generateRandomPassword(length = 10) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePic') cb(null, 'uploads/profilePics');
    else if (file.fieldname === 'idCard') cb(null, 'uploads/idCards');
    else cb(new Error('Invalid file field'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'idCard', maxCount: 1 }
]);

// Registration route
router.post('/register', (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }

    console.log('[1] Received form data:', req.body);
    console.log('[2] Received files:', req.files);

    try {
      const { fullName, email, phone, collegeName, collegeID } = req.body;

      if (!fullName || !email || !phone || !collegeName || !collegeID) {
        console.error('[3] Missing required form fields');
        return res.status(400).json({ error: 'All form fields are required' });
      }

      if (!req.files || !req.files['profilePic'] || !req.files['idCard']) {
        console.error('[4] Missing required files');
        return res.status(400).json({ error: 'Both profile picture and ID card are required' });
      }

      const profilePicPath = req.files['profilePic'][0].path;
      const idCardPath = req.files['idCard'][0].path;

      const randomPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      console.log('[5] Inserting into database');

      const query = `
        INSERT INTO users (full_name, email, phone, college_name, college_id, password, profile_pic, id_card)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [fullName, email, phone, collegeName, collegeID, hashedPassword, profilePicPath, idCardPath];

      connection.query(query, values, (dbErr, results) => {
        if (dbErr) {
          console.error('[6] DB Insertion Error:', dbErr);
          return res.status(500).json({ error: 'Database error: ' + dbErr.message });
        }

        console.log('[7] DB Insert successful. Sending email');

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Registration Password',
          html: `<p>Hi ${fullName},</p><p>Your password is <b>${randomPassword}</b></p>`
        };

        transporter.sendMail(mailOptions, (mailErr, info) => {
          if (mailErr) {
            console.error('[8] Email send error:', mailErr);
            return res.status(500).json({ error: 'Email error: ' + mailErr.message });
          }

          console.log('[9] Email sent successfully:', info.response);
          return res.status(200).json({ message: 'Registration successful. Password sent via email.' });
        });
      });
    } catch (catchErr) {
      console.error('[10] Unexpected error:', catchErr);
      return res.status(500).json({ error: 'Server error: ' + catchErr.message });
    }
  });
});

module.exports = router;
