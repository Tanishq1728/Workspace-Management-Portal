const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Tanishq1728@",
  database: "acrostic_management"
};

// 🔧 GET /tools
router.get("/tools", async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);
    const [tools] = await db.query("SELECT * FROM tools");
    res.json(tools);
  } catch (err) {
    console.error("Failed to load tools:", err);
    res.status(500).json({ error: "Server error fetching tools." });
  }
});

// 📊 GET /overview
router.get("/overview", async (req, res) => {
  try {
    const db = await mysql.createConnection(dbConfig);

    const today = new Date().toISOString().slice(0, 10);
    const [birthdaysThisMonth] = await db.query(
      `SELECT employee_name AS name, dob 
     FROM employees 
    WHERE MONTH(dob) = MONTH(?)`,
      [today]
    );

    const [upcomingBirthdays] = await db.query(
      `SELECT employee_name AS name, dob 
     FROM employees 
    WHERE dob > ? 
    ORDER BY dob 
    LIMIT 5`,
      [today]
    );
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const [[employeeTotal]] = await db.query("SELECT COUNT(*) AS count FROM employees");
    const [[projectsActive]] = await db.query("SELECT COUNT(*) AS count FROM projects WHERE status = 'active'");
    const [[projectsPaused]] = await db.query("SELECT COUNT(*) AS count FROM projects WHERE status = 'paused'");
    const [[projectsPast]] = await db.query("SELECT COUNT(*) AS count FROM projects WHERE status = 'completed'");
    const [[meetingsToday]] = await db.query("SELECT COUNT(*) AS count FROM meetings WHERE DATE(scheduled_date) = ?", [today]);

    const [leavesToday] = await db.query(
      "SELECT e.employee_name FROM leaves l JOIN employees e ON l.emp_id = e.id WHERE DATE(l.start_date) <= ? AND DATE(l.end_date) >= ?",
      [today, today]
    );

    const [leavesTomorrow] = await db.query(
      "SELECT e.employee_name FROM leaves l JOIN employees e ON l.emp_id = e.id WHERE DATE(l.start_date) <= ? AND DATE(l.end_date) >= ?",
      [tomorrow, tomorrow]
    );

    res.json({
      employees: employeeTotal.count,
      projects: projectsActive.count,
      projects_paused: projectsPaused.count,
      projects_past: projectsPast.count,
      meetings: meetingsToday.count,
      leaves: leavesToday.length,
      leaves_today: leavesToday.map(row => row.employee_name),
      leaves_tomorrow: leavesTomorrow.map(row => row.employee_name),
      birthdays_this_month: birthdaysThisMonth,
      upcoming_birthdays: upcomingBirthdays
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    res.status(500).json({ error: "Error fetching overview data." });
  }
});

module.exports = router;
