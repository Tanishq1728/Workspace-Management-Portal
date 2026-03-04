const express = require('express');
const db = require('../db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// ✅ Mail transporter using .env credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// ✅ Schedule meeting with email delivery & attendee linking
router.post('/schedule', async (req, res) => {
  const {
    title,
    description,
    scheduled_date,
    scheduled_time,
    duration,
    platform,
    meet_id,
    password,
    created_by,
    attendees = []
  } = req.body;

  try {
    if (!attendees.length) {
      return res.status(400).json({ error: "No attendees selected." });
    }

    // 🧠 Get attendee email list
    const [employeeList] = await db
      .promise()
      .query(
        `SELECT id, employee_name, email FROM employees WHERE id IN (${attendees.join(',')})`
      );

    // 📬 Compose email body
    const meetingDetails =
      platform === 'zoom'
        ? `Zoom ID: ${meet_id}${password ? `<br>Password: ${password}` : ''}`
        : `Google Meet Link: ${meet_id}`;

    const emailBody = `
      <p><strong>You’ve been invited to a meeting.</strong></p>
      <ul>
        <li><strong>Title:</strong> ${title}</li>
        <li><strong>Date:</strong> ${scheduled_date}</li>
        <li><strong>Time:</strong> ${scheduled_time}</li>
        <li><strong>Duration:</strong> ${duration}</li>
        <li><strong>Platform:</strong> ${platform}</li>
        <li><strong>Access:</strong><br>${meetingDetails}</li>
      </ul>
      ${description ? `<p><strong>Description:</strong><br>${description}</p>` : ""}
      <p>— Scheduler Dashboard</p>
    `;

    // 📤 Send emails
    for (const emp of employeeList) {
      if (!emp.email) continue;

      try {
        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: emp.email,
          subject: `📅 Invitation: ${title}`,
          html: emailBody
        });
      } catch (mailErr) {
        console.warn(`❌ Failed to email ${emp.email}:`, mailErr.message);
        return res.status(500).json({
          error: `Failed to send mail to ${emp.employee_name}. Meeting aborted.`
        });
      }
    }

    // ✅ Insert meeting
    const [meetingResult] = await db.promise().execute(
      `INSERT INTO meetings (
        title, description, scheduled_date, scheduled_time, duration,
        platform, meet_id, password, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        scheduled_date,
        scheduled_time,
        duration,
        platform,
        meet_id,
        password || null,
        created_by
      ]
    );

    const meetingId = meetingResult.insertId;

    // 🔗 Link attendees
    const linkQuery = `INSERT INTO meeting_links (meeting_id, employee_id) VALUES (?, ?)`;
    for (const empId of attendees) {
      await db.promise().execute(linkQuery, [meetingId, empId]);
    }

    res.json({ message: "✅ Meeting scheduled and invites sent.", meeting_id: meetingId });

  } catch (err) {
    console.error("💥 Meeting scheduling error:", err);
    res.status(500).json({ error: "Something went wrong while scheduling." });
  }
});

// ✅ GET /meetings — with attendee names
router.get('/', async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query(`
        SELECT m.*, 
          GROUP_CONCAT(e.employee_name SEPARATOR ', ') AS attendee_names
        FROM meetings m
        LEFT JOIN meeting_links ml ON m.id = ml.meeting_id
        LEFT JOIN employees e ON ml.employee_id = e.id
        GROUP BY m.id
        ORDER BY m.scheduled_date DESC, m.scheduled_time DESC
      `);
    res.json(rows);
  } catch (err) {
    console.error("⚠️ Failed to fetch meetings:", err);
    res.status(500).json({ error: "Could not fetch meetings." });
  }
});

module.exports = router;
