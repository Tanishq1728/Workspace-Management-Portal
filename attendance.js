const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const query = 'SELECT * FROM attendance_logs ORDER BY punch_time DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch attendance logs" });
    }
    res.json(results);
  });
});

module.exports = router;
