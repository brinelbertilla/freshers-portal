import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import clubRoutes from './routes/clubs.js';
import placementRoutes from './routes/placement.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import timetableRoutes from './routes/timetable.js';
import chatbotRoutes from './routes/chatbot.js';
import { startNotificationScheduler } from './utils/notificationScheduler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Freshers Portal API is running' });
});

// TEMPORARY DEBUG ROUTE — remove after diagnosing the DB_HOST/ETIMEDOUT issue.
app.get('/api/debug-db', async (req, res) => {
  const mask = (v) => (v ? `${v.slice(0, 3)}***(len:${v.length})` : '(empty)');
  const info = {
    DB_HOST: JSON.stringify(process.env.DB_HOST),
    DB_PORT: JSON.stringify(process.env.DB_PORT),
    DB_USER: mask(process.env.DB_USER),
    DB_NAME: JSON.stringify(process.env.DB_NAME),
    DB_SSL: JSON.stringify(process.env.DB_SSL),
    DB_PASSWORD_length: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0
  };

  try {
    const mysql = await import('mysql2/promise');
    const conn = await mysql.default.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 8000
    });
    await conn.query('SELECT 1');
    await conn.end();
    res.json({ envSeen: info, connection: 'SUCCESS' });
  } catch (err) {
    res.json({ envSeen: info, connection: 'FAILED', error: err.message, code: err.code });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startNotificationScheduler();
});