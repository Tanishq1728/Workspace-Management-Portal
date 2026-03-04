const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const router = express.Router();

// GET all employees
router.get('/', (req, res) => {
  const query = 'SELECT * FROM employees';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
    res.json(results);
  });
});

// POST new employee
router.post('/add', async (req, res) => {
  try {
    const { employee_name, gender, age, department, designation, contact_no, email, bio_id } = req.body;

    let image_filename = 'user.png';

    if (req.files && req.files.image) {
      const image = req.files.image;
      image_filename = Date.now() + '-' + image.name;
      const imagePath = path.join(__dirname, '../uploads/images/', image_filename);
      await image.mv(imagePath);
    }

    const sql = `
      INSERT INTO employees 
        (employee_name, age, department, designation, contact_no, gender, image_filename, email , bio_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [employee_name, age, department, designation, contact_no, gender, image_filename, email || null , bio_id];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: 'Failed to add employee' });
      }
      res.json({ message: 'Employee added successfully', employee_id: result.insertId });
    });
  } catch (err) {
    console.error('Error during employee addition:', err);
    res.status(500).json({ error: 'Something went wrong while adding the employee' });
  }
});

router.post('/update/:id', async (req, res) => {
  const employeeId = req.params.id;
  const { employee_name, gender, age, department, designation, contact_no, email , bio_id } = req.body;

  try {
    let image_filename = 'user.png';

    // Fetch current image_filename from DB
    const [existing] = await new Promise((resolve, reject) => {
      db.query('SELECT image_filename FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (existing) {
      image_filename = existing.image_filename;
    }

    // If new image uploaded, replace it
    if (req.files && req.files.image) {
      const image = req.files.image;
      image_filename = Date.now() + '-' + image.name;
      const imagePath = path.join(__dirname, '../uploads/images/', image_filename);
      await image.mv(imagePath);
    }

    const sql = `
  UPDATE employees SET 
    employee_name = ?, 
    gender = ?, 
    age = ?, 
    department = ?, 
    designation = ?, 
    contact_no = ?, 
    image_filename = ?, 
    email = ?, 
    bio_id = ?
  WHERE id = ?
`;


    const values = [
      employee_name?.trim(),
      gender?.trim() || null,
      age || null,
      department?.trim() || null,
      designation?.trim() || null,
      contact_no?.trim() || null,
      image_filename,
      email?.trim() || null,
      bio_id?.trim() || null,
      employeeId
    ];


    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: 'Failed to update employee' });
      }
      res.json({ message: 'Employee updated successfully' });
    });
  } catch (err) {
    console.error('Error during employee update:', err);
    res.status(500).json({ error: 'Something went wrong during update' });
  }
});

// DELETE employee
router.delete('/delete/:id', (req, res) => {
  const employeeId = req.params.id;

  const fetchQuery = 'SELECT image_filename FROM employees WHERE id = ?';
  db.query(fetchQuery, [employeeId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: 'Failed to locate employee' });
    }

    const image_filename = results[0].image_filename;

    const deleteQuery = 'DELETE FROM employees WHERE id = ?';
    db.query(deleteQuery, [employeeId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to delete employee' });
      }

      // Optional: delete image file (if not default)
      if (image_filename !== 'user.png') {
        const filePath = path.join(__dirname, '../uploads/images/', image_filename);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.warn('Image deletion failed:', unlinkErr);
        });
      }

      res.json({ message: 'Employee deleted successfully' });
    });
  });
});

module.exports = router;
