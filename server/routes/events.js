import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all events
router.get('/', verifyToken(), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC'
    );
    res.json({ events: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

// Get the events the logged-in student has registered for
router.get('/my/registrations', verifyToken('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, r.team_name, r.members, r.registered_at
       FROM registrations r
       JOIN events e ON e.id = r.item_id
       WHERE r.item_type = 'event' AND r.student_id = ?
       ORDER BY e.event_date ASC`,
      [req.user.id]
    );

    const events = rows.map((row) => {
      let members = row.members;
      if (typeof members === 'string') {
        try { members = JSON.parse(members); } catch { members = []; }
      }
      return { ...row, members: Array.isArray(members) ? members : [] };
    });

    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your registrations', error: err.message });
  }
});

// Create event (admin only)
router.post('/', verifyToken('admin'), async (req, res) => {
  try {
    const { title, incharge_name, event_date, event_time, place, purpose, category, agenda, company, organizer, interest_tags, requires_team, team_size } = req.body;

    const [result] = await pool.query(
      `INSERT INTO events (title, incharge_name, event_date, event_time, place, purpose, category, agenda, company, organizer, interest_tags, requires_team, team_size, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, incharge_name, event_date, event_time, place, purpose, category || 'all', agenda, company, organizer, JSON.stringify(interest_tags || []), !!requires_team, team_size || 1, req.user.id]
    );

    res.status(201).json({ message: 'Event created', eventId: result.insertId });

    // Broadcast a notification to all students right away — don't wait for the
    // day-of reminder scheduler for this "new event" alert.
    try {
      await pool.query(
        `INSERT INTO notifications (student_id, title, message, source_type, source_id, fire_at)
         VALUES (NULL, ?, ?, 'event', ?, NOW())`,
        [`New event: ${title}`, `${title} — ${new Date(event_date).toLocaleDateString()} at ${event_time}, ${place || 'venue TBA'}.`, result.insertId]
      );
    } catch (notifyErr) {
      console.error('Failed to create event notification:', notifyErr.message);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
});

// Update event (admin only)
router.put('/:id', verifyToken('admin'), async (req, res) => {
  try {
    const fields = ['title', 'incharge_name', 'event_date', 'event_time', 'place', 'purpose', 'category', 'agenda', 'company', 'organizer', 'interest_tags', 'requires_team', 'team_size'];
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
    await pool.query(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
});

// Delete event (admin only)
router.delete('/:id', verifyToken('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
});

// Register for event (student)
router.post('/:id/register', verifyToken('student'), async (req, res) => {
  try {
    const { team_name, members } = req.body;

    const [eventRows] = await pool.query('SELECT requires_team, team_size FROM events WHERE id = ?', [req.params.id]);
    const event = eventRows[0];
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const expectedSize = event.requires_team ? event.team_size : 1;

    if (event.requires_team && (!team_name || !team_name.trim())) {
      return res.status(400).json({ message: 'Team name is required for this event.' });
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
      'INSERT INTO registrations (student_id, item_type, item_id, team_name, members) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'event', req.params.id, event.requires_team ? team_name.trim() : null, JSON.stringify(members)]
    );
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Already registered for this event' });
    }
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

export default router;
