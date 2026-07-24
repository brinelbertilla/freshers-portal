import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get questions by category (aptitude | verbal | coding)
router.get('/questions/:category', verifyToken(), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM placement_questions WHERE category = ? ORDER BY difficulty',
      [req.params.category]
    );
    res.json({ questions: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Add practice question (admin only)
router.post('/questions', verifyToken('admin'), async (req, res) => {
  try {
    const { category, difficulty, question, options, answer } = req.body;
    const [result] = await pool.query(
      'INSERT INTO placement_questions (category, difficulty, question, options, answer) VALUES (?, ?, ?, ?, ?)',
      [category, difficulty || 'easy', question, options ? JSON.stringify(options) : null, answer]
    );
    res.status(201).json({ message: 'Question added', questionId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add question' });
  }
});

// Delete practice question (admin only)
router.delete('/questions/:id', verifyToken('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM placement_questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

export default router;
