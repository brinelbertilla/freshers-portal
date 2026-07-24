import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get timetable for student's branch, year, section
router.get('/', verifyToken('student'), async (req, res) => {
  try {
    const [student] = await pool.query('SELECT branch, year, section FROM students WHERE id = ?', [req.user.id]);

    if (!student.length || !student[0].branch) {
      return res.status(400).json({ message: 'Please complete your profile first (branch/year/section)' });
    }

    const { branch, year, section } = student[0];
    const [timetable] = await pool.query(
      `SELECT * FROM timetable WHERE branch = ? AND year = ? AND section = ?
       ORDER BY FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday'), period_no`,
      [branch, year, section]
    );

    res.json({ timetable });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch timetable' });
  }
});

// Create/update a timetable slot (admin only)
router.post('/', verifyToken('admin'), async (req, res) => {
  try {
    const { branch, year, section, day, period_no, subject_code, subject_name, faculty_name, is_lab } = req.body;
    await pool.query(
      `INSERT INTO timetable (branch, year, section, day, period_no, subject_code, subject_name, faculty_name, is_lab)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subject_code = VALUES(subject_code), subject_name = VALUES(subject_name),
         faculty_name = VALUES(faculty_name), is_lab = VALUES(is_lab)`,
      [branch, year, section, day, period_no, subject_code, subject_name || null, faculty_name, !!is_lab]
    );
    res.status(201).json({ message: 'Timetable slot saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save timetable slot', error: err.message });
  }
});

export default router;
