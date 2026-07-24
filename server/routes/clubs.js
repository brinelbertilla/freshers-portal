import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all clubs
router.get('/', verifyToken(), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clubs');
    res.json({ clubs: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch clubs' });
  }
});

// Create club (admin only)
router.post('/', verifyToken('admin'), async (req, res) => {
  try {
    const { name, incharge_name, time_slot, location, theme, category, description, interest_tags, requires_team, team_size } = req.body;

    const [result] = await pool.query(
      `INSERT INTO clubs (name, incharge_name, time_slot, location, theme, category, description, interest_tags, requires_team, team_size, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, incharge_name, time_slot, location, theme, category || 'all', description, JSON.stringify(interest_tags || []), !!requires_team, team_size || 1, req.user.id]
    );

    res.status(201).json({ message: 'Club created', clubId: result.insertId });

    try {
      await pool.query(
        `INSERT INTO notifications (student_id, title, message, source_type, source_id, fire_at)
         VALUES (NULL, ?, ?, 'club', ?, NOW())`,
        [`New club: ${name}`, `${name} just opened up — meets ${time_slot || 'TBA'} at ${location || 'TBA'}.`, result.insertId]
      );
    } catch (notifyErr) {
      console.error('Failed to create club notification:', notifyErr.message);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to create club' });
  }
});

// Update club (admin only)
router.put('/:id', verifyToken('admin'), async (req, res) => {
  try {
    const fields = ['name', 'incharge_name', 'time_slot', 'location', 'theme', 'category', 'description', 'interest_tags', 'requires_team', 'team_size'];
    const updates = [];
    const values = [];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(f === 'interest_tags' ? JSON.stringify(req.body[f] || []) : req.body[f]);
      }
    });

    if (!updates.length) return res.status(400).json({ message: 'No fields to update' });

    values.push(req.params.id);
    await pool.query(`UPDATE clubs SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Club updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update club', error: err.message });
  }
});

// Delete club (admin only)
router.delete('/:id', verifyToken('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM clubs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Club deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete club', error: err.message });
  }
});

// Join club (student)
router.post('/:id/join', verifyToken('student'), async (req, res) => {
  try {
    const { team_name, members } = req.body;

    const [clubRows] = await pool.query('SELECT requires_team, team_size FROM clubs WHERE id = ?', [req.params.id]);
    const club = clubRows[0];
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const expectedSize = club.requires_team ? club.team_size : 1;

    if (club.requires_team && (!team_name || !team_name.trim())) {
      return res.status(400).json({ message: 'Team/group name is required for this club.' });
    }
    if (!Array.isArray(members) || members.length !== expectedSize) {
      return res.status(400).json({ message: `Please provide details for exactly ${expectedSize} member(s).` });
    }
    for (const m of members) {
      if (!m.name || !m.branch || !m.year || !m.section) {
        return res.status(400).json({ message: 'Each registrant needs a name, branch, year, and section.' });
      }
    }

    await pool.query(
      'INSERT INTO registrations (student_id, item_type, item_id, team_name, members) VALUES (?, "club", ?, ?, ?)',
      [req.user.id, req.params.id, club.requires_team ? team_name.trim() : null, JSON.stringify(members)]
    );
    res.status(201).json({ message: 'Joined club successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Already joined this club' });
    }
    res.status(500).json({ message: 'Failed to join club' });
  }
});

export default router;
