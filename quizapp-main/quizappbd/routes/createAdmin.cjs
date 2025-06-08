// createAdmin.js
const bcrypt = require('bcrypt');
const pool = require('../db');

async function createAdmin() {
  const username = "admin";          // Change to your desired admin username
  const plainPassword = "admin123"; // Change to your desired admin password

  // Hash the plain password securely with bcrypt
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    // Insert admin user into your admins table
    const [result] = await pool.query(
      "INSERT INTO admins (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );
    console.log("Admin created:", username);
  } catch (err) {
    console.error("Error creating admin:", err);
  }
  process.exit();
}

createAdmin();
