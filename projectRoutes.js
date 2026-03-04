const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');


// 🔗 Connect to your DB
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Tanishq1728@',
  database: 'acrostic_management'
});

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, fileFilter });

// 📥 GET documents for a project
router.get('/projects/:id/documents', (req, res) => {
  const sql = 'SELECT * FROM project_documents WHERE project_id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch docs' });
    res.json(results);
  });
});

// 📤 UPLOAD document
router.post('/projects/:id/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file || !req.body.title) {
      console.error("❌ Missing file or title:", {
        file: req.file,
        title: req.body.title,
        body: req.body
      });
      return res.status(400).json({ error: "Missing file or title" });
    }

    const { filename } = req.file;
    const title = req.body.title;
    const remark = req.body.remark || null;
    const projectId = req.params.id;

    const sql = `
      INSERT INTO project_documents (project_id, file_name, original_name, remark)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [projectId, filename, title, remark], (dbErr) => {
      if (dbErr) {
        console.error("DB insert error:", dbErr);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(200).json({ message: "✅ Upload successful" });
    });
  });
});


// 🗑️ DELETE document
router.delete('/documents/:id', (req, res) => {
  const sql = 'DELETE FROM project_documents WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ message: 'File deleted' });
  });
});

// ✏️ RENAME document title
router.put('/documents/:id/rename', (req, res) => {
  const sql = 'UPDATE project_documents SET original_name = ? WHERE id = ?';
  db.query(sql, [req.body.newName, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Rename failed' });
    res.json({ message: 'Renamed' });
  });
});

// ✏️ EDIT remark
router.put('/documents/:id/edit-remark', (req, res) => {
  const sql = 'UPDATE project_documents SET remark = ? WHERE id = ?';
  db.query(sql, [req.body.newRemark, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Remark update failed' });
    res.json({ message: 'Remark updated' });
  });
});

// 📊 GET all projects
router.get('/projects', (req, res) => {
  db.query('SELECT * FROM projects ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Failed to fetch projects:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// 🆕 POST new project
router.post('/projects/add', (req, res) => {
  const {
    project_name,
    description,
    client_name,
    team_lead,
    start_date,
    end_date,
    status,
    status_icon
  } = req.body;

  const sql = `
    INSERT INTO projects (project_name, description, client_name, team_lead, start_date, end_date, status, status_icon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [project_name, description, client_name, team_lead, start_date, end_date, status, status_icon], (err, result) => {
    if (err) {
      console.error('Failed to insert project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ message: 'Project created', id: result.insertId });
  });
});

// 🔁 UPDATE project by ID
router.post('/projects/update/:id', (req, res) => {
  const projectId = req.params.id;
  const {
    project_name,
    description,
    client_name,
    team_lead,
    start_date,
    end_date,
    status,
    status_icon
  } = req.body;

  const sql = `
    UPDATE projects
    SET project_name = ?, description = ?, client_name = ?, team_lead = ?, start_date = ?, end_date = ?, status = ?, status_icon = ?, last_updated = NOW()
    WHERE id = ?
  `;

  db.query(sql, [project_name, description, client_name, team_lead, start_date, end_date, status, status_icon, projectId], (err, result) => {
    if (err) {
      console.error('Failed to update project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ message: 'Project updated successfully' });
  });
});

module.exports = router;
