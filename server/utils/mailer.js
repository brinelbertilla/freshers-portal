import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Tracks the outcome of the most recent send attempt in server-side memory
// (logged to the console) so it's easy to debug from the terminal without
// exposing anything about email delivery in the admin UI itself.
const lastMailInfo = { at: null, ok: null, to: null, note: null };

// Verify credentials once at startup so a bad Gmail password shows up in the
// server log immediately instead of only surfacing the first time a student
// tries to reset their password.
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((err) => {
    if (err) {
      console.error(
        '[mailer] Gmail login failed — reset emails will NOT be delivered:',
        err.message,
        '\n[mailer] The single most common cause: SMTP_PASS must be a 16-character Gmail "App Password" ' +
        '(Google Account → Security → 2-Step Verification → App passwords), NOT your normal Gmail login password. ' +
        'App passwords require 2-Step Verification to be turned on for the account first.'
      );
    } else {
      console.log('[mailer] Gmail credentials verified — reset emails should send correctly.');
    }
  });
} else {
  console.warn('[mailer] SMTP_USER / SMTP_PASS not set in server/.env — reset emails will not be sent.');
}

export async function sendMail({ to, subject, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    lastMailInfo.at = new Date().toISOString();
    lastMailInfo.ok = false;
    lastMailInfo.to = to;
    lastMailInfo.note = 'SMTP_USER / SMTP_PASS not set in server/.env';
    console.warn('SMTP_USER / SMTP_PASS not set in .env - skipping email send.');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Freshers Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text
    });
    lastMailInfo.at = new Date().toISOString();
    lastMailInfo.ok = true;
    lastMailInfo.to = to;
    lastMailInfo.note = null;
  } catch (err) {
    lastMailInfo.at = new Date().toISOString();
    lastMailInfo.ok = false;
    lastMailInfo.to = to;
    lastMailInfo.note = err.message;
    // Re-throw so callers (e.g. the event reminder scheduler) know the send failed —
    // they can still choose to respond generically to the user for
    // security, but now they have a way to check what actually happened.
    throw err;
  }
}

export function getMailerStatus() {
  return {
    configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    smtpUser: process.env.SMTP_USER || null,
    lastMail: lastMailInfo
  };
}

export default sendMail;
