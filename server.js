const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const mysql = require("mysql2/promise");
const ZKLib = require("node-zklib");

const projectRoutes = require('./routes/projectRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaveRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');


const app = express();
const PORT = 5050;

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use(express.static('public'));

app.use('/api', projectRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.get("/api/zkconnector/sync", async (req, res) => {
  try {
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "Tanishq1728@",
      database: "acrostic_management"
    });

    const zk = new ZKLib("192.168.31.201", 4370, 10000, 0);
    await zk.createSocket();
    console.log("✅ Connected to ZKTeco");

    // 1) Load last_sync
    const [tracker] = await db.query(
      "SELECT last_sync FROM attendance_sync_tracker WHERE id = 1"
    );
    const lastSyncTime = tracker[0]?.last_sync || new Date(0);
    console.log("⏳ Last Sync Time:", lastSyncTime);

    // 2) Fetch & sort raw logs
    const deviceRes = await zk.getAttendances();
    const rawLogs = deviceRes.data || [];
    rawLogs.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));

    // 3) Filter only new
    const toProcess = rawLogs.filter(
      l => new Date(l.recordTime) >= new Date(lastSyncTime)
    );
    console.log(`→ ${toProcess.length} records to process`);

    let maxPunchTime = new Date(lastSyncTime);
    let insertedCount = 0;
    const syncTime = new Date(); // timestamp for this sync

    for (const log of toProcess) {
      const bio_id = log.deviceUserId?.toString();
      if (!bio_id || !log.recordTime) continue;

      // 4) Format sv-SE
      const punch_time = new Date(log.recordTime).toLocaleString('sv-SE');
      const dateKey = new Date(log.recordTime).toLocaleDateString('sv-SE');

      // 5) Skip exact duplicates
      const [dup] = await db.query(
        "SELECT COUNT(*) AS cnt FROM attendance_logs WHERE bio_id = ? AND punch_time = ?",
        [bio_id, punch_time]
      );
      if (dup[0].cnt > 0) continue;

      // 6) Load all existing punches for that day
      const [dayPunches] = await db.query(
        "SELECT punch_time, status_note FROM attendance_logs WHERE bio_id = ? AND DATE(punch_time) = ? ORDER BY punch_time",
        [bio_id, dateKey]
      );

      // --- NEW: If this is the second punch of the day, clear the first record's "single" note ---
      if (dayPunches.length === 1) {
        const firstTime = dayPunches[0].punch_time;
        await db.query(
          "UPDATE attendance_logs SET status_note = '' WHERE bio_id = ? AND punch_time = ?",
          [bio_id, firstTime]
        );
      }

      // 7) Build full today’s list
      const allPunches = [
        ...dayPunches.map(r => r.punch_time),
        punch_time
      ].sort();

      const idx = allPunches.indexOf(punch_time);
      let punch_type = "in";
      let status_note = "";

      // 8) Apply IN/OUT rules
      if (idx === 0) {
        // first punch of day → clock-time rule
        punch_type = punch_time.slice(11, 13) < "12" ? "in" : "out";
        status_note = allPunches.length === 1 ? "single" : "";
      } else {
        // subsequent punches by position
        if (idx === 1) {
          punch_type = "out";
        } else if (idx === 2) {
          punch_type = "in";
          status_note = "reentry_in";
        } else if (idx === 3) {
          punch_type = "out";
          status_note = "reentry_out";
        } else {
          // beyond 4th
          punch_type = idx % 2 === 0 ? "in" : "out";
        }
      }

      console.log(`📌 ${bio_id} @ ${punch_time} → ${punch_type} [${status_note}]`);

      // 9) Insert into DB
      await db.query(
        "INSERT INTO attendance_logs (bio_id, punch_time, punch_type, status_note) VALUES (?,?,?,?)",
        [bio_id, punch_time, punch_type, status_note]
      );

      insertedCount++;
      if (new Date(punch_time) > maxPunchTime) {
        maxPunchTime = new Date(punch_time);
      }
    }

    // 10) Update last_sync if new entries exist
    if (insertedCount > 0) {
      await db.query(
        "UPDATE attendance_sync_tracker SET last_sync = ? WHERE id = 1",
        [syncTime]  // mysql2 serializes JS Date to proper DATETIME
      );
    }

    console.log(`✅ Sync complete. ${insertedCount} added. syncTime=${syncTime}`);
    res.json({
      message: "Sync complete",
      timestamp: insertedCount > 0 ? syncTime.toISOString() : lastSyncTime,
      inserted: insertedCount
    });

  } catch (err) {
    console.error("❌ Sync error:", err);
    res.status(500).json({ message: "Sync failed", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
