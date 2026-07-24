import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get notifications for student
router.get('/', verifyToken('student'), async (req, res) => {
  try {
    const [notifications] = await pool.query(
      `SELECT * FROM notifications
       WHERE (student_id IS NULL OR student_id = ?) AND is_dismissed = FALSE
       ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.put('/:id/read', verifyToken('student'), async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Dismiss
router.put('/:id/dismiss', verifyToken('student'), async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_dismissed = TRUE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Dismissed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dismiss notification' });
  }
});

export default router;
