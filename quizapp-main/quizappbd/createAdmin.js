import bcrypt from 'bcrypt';
import pool from './db.js';// Use './db' instead of '../db' if file is in same folder

async function createAdmin() {
  const username = "admin";
  const plainPassword = "admin123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    const [result] = await pool.query(
      "INSERT INTO admin (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );
    console.log("Admin created:", username);
  } catch (err) {
    console.error("Error creating admin:", err);
  }
  process.exit();
}

createAdmin();
