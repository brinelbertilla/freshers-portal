import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Student Signup
router.post('/student/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'email, password and full_name are required' });
    }

    const [existing] = await pool.query('SELECT id FROM students WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO students (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email, hashedPwd, full_name]
    );

    res.status(201).json({ message: 'Student created', studentId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// Student Login
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);

    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const student = rows[0];
    const validPwd = await bcrypt.compare(password, student.password_hash);

    if (!validPwd) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: student.id, role: 'student', email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      student: {
        id: student.id,
        email: student.email,
        name: student.full_name,
        profile_completed: !!student.profile_completed
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const admin = rows[0];
    const validPwd = await bcrypt.compare(password, admin.password_hash);

    if (!validPwd) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, role: 'admin', username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Get Profile
router.get('/profile', verifyToken(), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, full_name, branch, year, section, interests, profile_completed FROM students WHERE id = ?', [req.user.id]);
    res.json({ student: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update Profile (branch, year, section, interests)
router.put('/profile', verifyToken('student'), async (req, res) => {
  try {
    const { branch, year, section, interests } = req.body;
    await pool.query(
      'UPDATE students SET branch = ?, year = ?, section = ?, interests = ?, profile_completed = TRUE WHERE id = ?',
      [branch, year, section, JSON.stringify(interests || []), req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

export default router;
