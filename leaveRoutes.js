// routes/leaveRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const query = `
    SELECT 
      l.leave_id, 
      e.employee_name AS employeeName, 
      l.start_date, 
      l.end_date, 
      l.leave_type
    FROM leaves l
    JOIN employees e ON l.emp_id = e.id
    ORDER BY l.start_date DESC
  `;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching leaves:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

router.post("/", (req, res) => {
  const { emp_id, startDate, endDate, leaveType } = req.body;
  const query = `
    INSERT INTO leaves (emp_id, start_date, end_date, leave_type)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [emp_id, startDate, endDate, leaveType], (err, result) => {
    if (err) {
      console.error("Error adding leave:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Leave added", leave_id: result.insertId });
  });
});

router.put("/:leave_id", (req, res) => {
  const { leave_id } = req.params;
  const { emp_id, startDate, endDate, leaveType } = req.body;

  const query = `
    UPDATE leaves SET emp_id = ?, start_date = ?, end_date = ?, leave_type = ?
    WHERE leave_id = ?
  `;

  db.query(query, [emp_id, startDate, endDate, leaveType, leave_id], (err, result) => {
    if (err) {
      console.error("Error updating leave:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Leave updated" });
  });
});

router.delete("/:leave_id", (req, res) => {
  const { leave_id } = req.params;
  db.query("DELETE FROM leaves WHERE leave_id = ?", [leave_id], (err, result) => {
    if (err) {
      console.error("Error deleting leave:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Leave deleted" });
  });
});


module.exports = router;
