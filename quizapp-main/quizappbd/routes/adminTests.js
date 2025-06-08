const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyAdmin = require('../middleware/verifyAdmin');

// View All Tests
router.get('/tests', verifyAdmin, async (req, res) => {
  const [rows] = await db.query("SELECT * FROM tests");
  res.json(rows);
});

// Create Test
router.post('/tests', verifyAdmin, async (req, res) => {
  const { name, description } = req.body;
  await db.query("INSERT INTO tests (name, description) VALUES (?, ?)", [name, description]);
  res.send("Test created");
});

// Update Test
router.put('/tests/:id', verifyAdmin, async (req, res) => {
  const { name, description } = req.body;
  await db.query("UPDATE tests SET name = ?, description = ? WHERE id = ?", [name, description, req.params.id]);
  res.send("Test updated");
});

// Delete Test
router.delete('/tests/:id', verifyAdmin, async (req, res) => {
  await db.query("DELETE FROM tests WHERE id = ?", [req.params.id]);
  res.send("Test deleted");
});

module.exports = router;
