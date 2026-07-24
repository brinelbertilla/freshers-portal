import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// MySQL's driver auto-parses JSON columns into real JS arrays/objects, but
// MariaDB has no native JSON type at all — it's just an alias for LONGTEXT
// with a CHECK constraint — so mysql2 never gets a "this is JSON" flag back
// from MariaDB and the column comes through as a plain string instead of a
// parsed value. That's a very common setup for local dev (XAMPP/WAMP default
// to MariaDB), and it's exactly why team member lists could silently vanish:
// the frontend's `Array.isArray(members)` check fails on a string, so it
// falls back to showing only the single logged-in registrant instead of the
// full team. Normalize here so callers always get a real array either way.
function parseMembers(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Get registrations for an event
router.get('/events/:eventId/registrations', verifyToken('admin'), async (req, res) => {
  try {
    const [registrations] = await pool.query(
      `SELECT s.id, s.full_name, s.email, s.branch, s.year, s.section, r.registered_at, r.team_name, r.members
       FROM registrations r
       JOIN students s ON s.id = r.student_id
       WHERE r.item_type = 'event' AND r.item_id = ?`,
      [req.params.eventId]
    );
    const normalized = registrations.map((r) => ({ ...r, members: parseMembers(r.members) }));
    res.json({ count: normalized.length, students: normalized });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

// Get members for a club
router.get('/clubs/:clubId/members', verifyToken('admin'), async (req, res) => {
  try {
    const [members] = await pool.query(
      `SELECT s.id, s.full_name, s.email, s.branch, s.year, s.section, r.registered_at, r.team_name, r.members
       FROM registrations r
       JOIN students s ON s.id = r.student_id
       WHERE r.item_type = 'club' AND r.item_id = ?`,
      [req.params.clubId]
    );
    const normalized = members.map((m) => ({ ...m, members: parseMembers(m.members) }));
    res.json({ count: normalized.length, students: normalized });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Get all students with what events/clubs they've registered for
router.get('/students', verifyToken('admin'), async (req, res) => {
  try {
    const [students] = await pool.query(
      `SELECT id, full_name, email, branch, year, section, interests, profile_completed, created_at
       FROM students ORDER BY created_at DESC`
    );

    const [eventRegs] = await pool.query(
      `SELECT r.student_id, e.title FROM registrations r
       JOIN events e ON e.id = r.item_id WHERE r.item_type = 'event'`
    );
    const [clubRegs] = await pool.query(
      `SELECT r.student_id, c.name FROM registrations r
       JOIN clubs c ON c.id = r.item_id WHERE r.item_type = 'club'`
    );

    const eventsByStudent = {};
    eventRegs.forEach((r) => {
      (eventsByStudent[r.student_id] = eventsByStudent[r.student_id] || []).push(r.title);
    });
    const clubsByStudent = {};
    clubRegs.forEach((r) => {
      (clubsByStudent[r.student_id] = clubsByStudent[r.student_id] || []).push(r.name);
    });

    const result = students.map((s) => ({
      ...s,
      events: eventsByStudent[s.id] || [],
      clubs: clubsByStudent[s.id] || []
    }));

    res.json({ count: result.length, students: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
});

// Dashboard summary stats
router.get('/stats', verifyToken('admin'), async (req, res) => {
  try {
    const [[studentCount]] = await pool.query('SELECT COUNT(*) as count FROM students');
    const [[eventCount]] = await pool.query('SELECT COUNT(*) as count FROM events');
    const [[clubCount]] = await pool.query('SELECT COUNT(*) as count FROM clubs');

    res.json({
      students: studentCount.count,
      events: eventCount.count,
      clubs: clubCount.count
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

export default router;
