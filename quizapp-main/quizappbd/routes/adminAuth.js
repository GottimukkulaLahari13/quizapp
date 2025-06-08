const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db'); // Your database connection module
const jwt = require('jsonwebtoken');

const SECRET_KEY = "SECRET_KEY"; // Ideally move to env variables

// Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send("Access Denied");

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
}

// Admin login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Restrict access to localhost only
  if (req.hostname !== 'localhost' && req.hostname !== '127.0.0.1') {
    return res.status(403).send("Access denied");
  }

  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
    const admin = rows[0];
    if (!admin) return res.status(401).send("Invalid credentials");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).send("Invalid credentials");

    const token = jwt.sign({ adminId: admin.id }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = { router, verifyAdmin };
