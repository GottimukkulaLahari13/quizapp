import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = "SECRET_KEY"; // move to env in production

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
  const ip = req.ip || req.connection.remoteAddress;
  //if (!ip.includes('127.0.0.1') && !ip.includes('::1')) {
    //return res.status(403).send("Access denied (outside localhost)");
  //}

  try {
    const [rows] = await db.query("SELECT * FROM admin WHERE username = ?", [username]);
    const admin = rows[0];
    if (!admin) return res.status(401).send("Invalid credentials");

    // DEBUG (optional)
    console.log("Plain password from frontend:", password);
    console.log("Hashed password from DB:", admin.password);

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) return res.status(401).send("Invalid credentials");

    const token = jwt.sign({ adminId: admin.id }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export { router, verifyAdmin };
