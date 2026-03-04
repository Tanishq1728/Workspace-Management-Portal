const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Tanishq1728@',
  database: 'acrostic_management'  // Ensure this DB exists
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err);
  } else {
    console.log(' ✅ DB connected successfully');
  }
});

module.exports = db;
