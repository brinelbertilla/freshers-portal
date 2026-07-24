// Runs periodically (every 15 min) to create notifications for events/training
// happening soon, and to send reminder emails. Started automatically by server.js.
import cron from 'node-cron';
import pool from '../config/db.js';
import { sendMail } from './mailer.js';

export function startNotificationScheduler() {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await createUpcomingEventNotifications();
    } catch (err) {
      console.error('Notification scheduler error:', err.message);
    }
  });

  console.log('✓ Notification scheduler started (runs every 15 min)');
}

async function createUpcomingEventNotifications() {
  // Find events happening within the next 24 hours that haven't been reminded yet
  const [events] = await pool.query(
    `SELECT * FROM events
     WHERE reminder_sent = FALSE
       AND event_date = CURDATE()`
  );

  for (const event of events) {
    await pool.query(
      `INSERT INTO notifications (student_id, title, message, source_type, source_id, fire_at)
       VALUES (NULL, ?, ?, 'event', ?, NOW())`,
      [`Reminder: ${event.title}`, `${event.title} is happening today at ${event.event_time} in ${event.place}.`, event.id]
    );

    await pool.query('UPDATE events SET reminder_sent = TRUE WHERE id = ?', [event.id]);
  }

  if (events.length) {
    console.log(`✓ Created ${events.length} event reminder notification(s)`);
  }
}
