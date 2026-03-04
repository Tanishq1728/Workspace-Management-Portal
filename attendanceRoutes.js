const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/sync', async (req, res) => {
  const { uid, timestamp, type } = req.body;

  if (!uid || !timestamp || !type) {
    return res.status(400).json({ error: "Missing required fields in payload." });
  }

  try {
    // Step 1: Check if fingerprint ID is already mapped
    const [rows] = await db.promise().query(
      `SELECT id FROM employees WHERE fingerprint_id = ?`,
      [uid.toString()]
    );

    let employee_id;

    // Step 2: If not found, create employee stub with UID
    if (rows.length === 0) {
      const [result] = await db.promise().query(
        `INSERT INTO employees (employee_name, fingerprint_id)
         VALUES (?, ?)`,
        [`User ${uid}`, uid.toString()]
      );
      employee_id = result.insertId;
      console.log(`👤 New employee created → UID ${uid}, ID ${employee_id}`);
    } else {
      employee_id = rows[0].id;
    }

    // Step 3: Insert attendance
    await db.promise().query(
      `INSERT INTO attendance (fingerprint_id, employee_id, timestamp, type, status)
       VALUES (?, ?, ?, ?, ?)`,
      [uid.toString(), employee_id, timestamp, type, 'present']
    );

    res.json({ message: `✅ Attendance recorded for UID ${uid}` });
  } catch (err) {
    console.error("💥 Sync error:", err.message);
    res.status(500).json({ error: "Failed to record attendance." });
  }
});

module.exports = router;
