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

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startNotificationScheduler();
});

