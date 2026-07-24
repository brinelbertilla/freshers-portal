import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import axios from 'axios';
import pool from '../config/db.js';

const router = express.Router();

// Google's Gemini model lineup changes fairly often (old models get shut down
// on a rolling basis — gemini-pro, gemini-1.5-flash, and gemini-2.0-flash have
// ALL since been retired and now return 404 for everyone, regardless of key).
// To stop this list from going stale every few months, we lead with Google's
// own auto-updating aliases, which they maintain to always point at whatever
// their current recommended model is — no code change needed when Google
// ships a new generation. The versioned names after them are just an extra
// safety net in case an alias is ever unavailable on a given account/region.
const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

// Normalize once at startup. The single biggest cause of "I added a key but
// it still isn't working" reports is stray whitespace/quotes copied in from a
// .env editor, or the key being set in .env.example instead of the real .env
// (which is git-ignored and easy to forget to fill in on a fresh clone) —
// trimming here and logging a clear status line makes both cases obvious.
const RAW_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_KEY = RAW_KEY.trim().replace(/^['"]|['"]$/g, '');
const KEY_IS_CONFIGURED = !!GEMINI_KEY && GEMINI_KEY !== 'your_gemini_key';

if (!KEY_IS_CONFIGURED) {
  console.warn(
    '[chatbot] GEMINI_API_KEY is not set (or is still the placeholder value) in server/.env — ' +
    'the chatbot will only use the built-in canned/offline replies until a real key is added there ' +
    '(not server/.env.example) and the server is restarted.'
  );
} else {
  console.log(`[chatbot] Gemini API key detected (length ${GEMINI_KEY.length}) — live AI replies enabled.`);
}

// Tracks the outcome of the most recent Gemini call so an admin can check
// /api/chatbot/status instead of guessing why replies look "canned".
const lastCallInfo = { at: null, ok: null, model: null, status: null, note: null };

const ORDINAL_WORDS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10
};

function ordinalSuffix(n) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Pulls together everything about the logged-in student that the chatbot
// might need to answer personal questions accurately: today's timetable,
// upcoming events, and available clubs. Used both to ground the real Gemini
// call (so it doesn't guess) and to power the offline fallback below.
async function getStudentContext(user) {
  const context = { today: null, timetableToday: [], timetableWeek: [], upcomingEvents: [], clubs: [] };
  if (!user || user.role !== 'student') return context;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  context.today = today;

  try {
    const [studentRows] = await pool.query('SELECT branch, year, section FROM students WHERE id = ?', [user.id]);
    const student = studentRows[0];

    if (student?.branch) {
      const [timetable] = await pool.query(
        `SELECT period_no, subject_name, subject_code, faculty_name, is_lab
         FROM timetable WHERE branch = ? AND year = ? AND section = ? AND day = ?
         ORDER BY period_no`,
        [student.branch, student.year, student.section, today]
      );
      context.timetableToday = timetable;

      // Full week (all days) is needed so questions like "who is Dinesh" or
      // "which day does Kavya Iyer teach me" can be answered even when today
      // isn't the day that faculty teaches this student.
      const [week] = await pool.query(
        `SELECT day, period_no, subject_name, subject_code, faculty_name, is_lab
         FROM timetable WHERE branch = ? AND year = ? AND section = ?
         ORDER BY FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), period_no`,
        [student.branch, student.year, student.section]
      );
      context.timetableWeek = week;
    }
  } catch (err) {
    console.error('Chatbot context: failed to load timetable', err.message);
  }

  try {
    // NOTE: this used to be LIMIT 8. Once a college has 8+ upcoming events on
    // the calendar, any event that didn't happen to sort into the top 8 by
    // date was silently excluded from what the chatbot could see — even
    // though it existed in the DB — which is exactly why older/seed events
    // kept working while newly-created ones "disappeared" from the AI's
    // answers. Raised well above realistic event counts for a single college
    // portal so newly created events always make it into context.
    const [events] = await pool.query(
      `SELECT id, title, event_date, event_time, place, requires_team, team_size FROM events WHERE event_date >= CURDATE()
       ORDER BY event_date, event_time LIMIT 100`
    );
    context.upcomingEvents = events;
  } catch (err) {
    console.error('Chatbot context: failed to load events', err.message);
  }

  try {
    // Same fix as above — raised from LIMIT 10 so newly added clubs aren't
    // silently dropped from context once there are more than 10 clubs.
    const [clubs] = await pool.query('SELECT id, name, category, time_slot, requires_team, team_size FROM clubs LIMIT 100');
    context.clubs = clubs;
  } catch (err) {
    console.error('Chatbot context: failed to load clubs', err.message);
  }

  // What has this student already registered/joined? Lets the bot say
  // "you're already registered" instead of repeating generic instructions.
  try {
    const [regs] = await pool.query(
      `SELECT item_type, item_id FROM registrations WHERE student_id = ?`,
      [user.id]
    );
    context.registeredEventIds = regs.filter((r) => r.item_type === 'event').map((r) => r.item_id);
    context.joinedClubIds = regs.filter((r) => r.item_type === 'club').map((r) => r.item_id);
  } catch (err) {
    context.registeredEventIds = [];
    context.joinedClubIds = [];
  }

  return context;
}

// Turns the context into plain text Gemini can read as grounding — this is
// what makes real AI answers accurate instead of generic.
function buildContextPrompt(context) {
  const lines = [];
  lines.push('You are the assistant inside a college "Freshers Portal" web app. Answer briefly and helpfully. Use the data below when the question is about the student\'s own schedule, events, or clubs. If the data doesn\'t cover the question, answer generally about student/campus life.');
  lines.push('The student cannot register for events or join clubs through this chat — you do not have a booking action available. If asked to register/join, tell them which page to open (Events or Clubs, from the navbar) and, if that event/club requires team/group registration, mention that they will need to enter a team name and each member\'s name, section, and year in the form that pops up there.');

  if (context.timetableToday.length) {
    lines.push(`\nToday is ${context.today}. The student's timetable for today:`);
    context.timetableToday.forEach((slot) => {
      lines.push(`Period ${slot.period_no}: ${slot.subject_name || slot.subject_code}${slot.is_lab ? ' (Lab)' : ''}${slot.faculty_name ? ' — ' + slot.faculty_name : ''}`);
    });
  } else if (context.today) {
    lines.push(`\nToday is ${context.today}. No timetable data is available for this student yet (profile may be incomplete).`);
  }

  if (context.timetableWeek?.length) {
    lines.push('\nFull week timetable (for answering "who is [faculty]" or "which day/period is [subject]" questions):');
    context.timetableWeek.forEach((slot) => {
      lines.push(`${slot.day}, Period ${slot.period_no}: ${slot.subject_name || slot.subject_code}${slot.is_lab ? ' (Lab)' : ''}${slot.faculty_name ? ' — taught by ' + slot.faculty_name : ''}`);
    });
    lines.push('If asked "who is <name>" and that name matches (even loosely, including transliterations of Indian-language names) a faculty member above, answer with which subject(s) they teach this student and on which day/period — do not say you don\'t have information about a person unless no reasonable match exists.');
  }

  if (context.upcomingEvents.length) {
    lines.push('\nUpcoming events:');
    context.upcomingEvents.forEach((e) => {
      const registered = context.registeredEventIds?.includes(e.id);
      const teamNote = e.requires_team ? ` [team registration, ${e.team_size} members]` : '';
      lines.push(`${e.title} — ${new Date(e.event_date).toLocaleDateString()} at ${e.place || 'TBA'}${teamNote}${registered ? ' (student already registered)' : ''}`);
    });
  }

  if (context.clubs.length) {
    lines.push('\nClubs available:');
    context.clubs.forEach((c) => {
      const joined = context.joinedClubIds?.includes(c.id);
      const teamNote = c.requires_team ? ` [team registration, ${c.team_size} members]` : '';
      lines.push(`${c.name} (${c.category})${teamNote}${joined ? ' (student already joined)' : ''}`);
    });
  }

  return lines.join('\n');
}

// Handles "register me for X" / "how do I join Y" style questions directly and
// deterministically, using real DB data — so this always works even without a
// Gemini key, and Gemini isn't left to guess at page names or team-form details.
function answerRegistrationIntent(message, context) {
  const lower = message.toLowerCase();
  const wantsToAct = /(register|join|sign up|signup|enrol|enroll)/.test(lower);
  if (!wantsToAct) return null;

  const findMatch = (list, nameKey) =>
    list.find((item) => lower.includes(item[nameKey].toLowerCase()));

  const eventMatch = findMatch(context.upcomingEvents || [], 'title');
  const clubMatch = findMatch(context.clubs || [], 'name');

  if (eventMatch) {
    if (context.registeredEventIds?.includes(eventMatch.id)) {
      return `You're already registered for "${eventMatch.title}" — no action needed! You can double-check under Events in the navbar.`;
    }
    const teamNote = eventMatch.requires_team
      ? ` This event needs a team registration — the form will ask for your team name and each member's name, section, and year (${eventMatch.team_size} member${eventMatch.team_size > 1 ? 's' : ''} total).`
      : '';
    return `To register for "${eventMatch.title}", open the Events page from the navbar, find its card, and click Register.${teamNote} It's on ${new Date(eventMatch.event_date).toLocaleDateString()} at ${eventMatch.place || 'a venue that will be announced'}.`;
  }

  if (clubMatch) {
    if (context.joinedClubIds?.includes(clubMatch.id)) {
      return `You've already joined ${clubMatch.name} — you're all set!`;
    }
    const teamNote = clubMatch.requires_team
      ? ` Joining needs a team registration — you'll be asked for a team name and each member's name, section, and year (${clubMatch.team_size} member${clubMatch.team_size > 1 ? 's' : ''} total).`
      : '';
    return `To join ${clubMatch.name}, open the Clubs page from the navbar and click Join Club on its card.${teamNote}`;
  }

  // They want to register/join something but didn't name a specific event/club
  // we recognize — point them to the right page instead of guessing.
  if (/event/.test(lower)) {
    return "You can register for any event from the Events page in the navbar — open it, find the event, and click Register. Some events ask for a team name and member details if it's a group event.";
  }
  if (/club/.test(lower)) {
    return "You can join any club from the Clubs page in the navbar — open it and click Join Club on the one you want. A few clubs ask for team/group details if they take members as a group.";
  }
  return null;
}

// Tries to directly answer "what's my Nth period" style questions using the
// real timetable data, without needing Gemini at all.
function answerPeriodQuestion(message, context) {
  const lower = message.toLowerCase();
  if (!lower.includes('period')) return null;

  let periodNo = null;
  // Tolerant of common typos like "3dr" (meant "3rd") — instead of requiring
  // an exact st/nd/rd/th suffix, just grab the leading digit(s) and allow any
  // short run of letters before "period".
  const digitMatch = lower.match(/(\d+)\s*[a-z]{0,3}\s*period/);
  if (digitMatch) {
    periodNo = parseInt(digitMatch[1], 10);
  } else {
    for (const [word, num] of Object.entries(ORDINAL_WORDS)) {
      if (lower.includes(word)) { periodNo = num; break; }
    }
  }
  if (!periodNo) return null;

  if (!context.timetableToday.length) {
    return `I don't have timetable data for you yet — make sure your profile (branch/year/section) is complete, and an admin has uploaded your section's timetable.`;
  }

  const slot = context.timetableToday.find((s) => s.period_no === periodNo);
  if (!slot) {
    return `You don't have a ${periodNo}${ordinalSuffix(periodNo)} period listed today (${context.today}) — it might be a break or a free slot.`;
  }

  return `Your ${periodNo}${ordinalSuffix(periodNo)} period today (${context.today}) is ${slot.subject_name || slot.subject_code}${slot.is_lab ? ' (Lab)' : ''}${slot.faculty_name ? ' with ' + slot.faculty_name : ''}.`;
}

// Tries to directly answer "who is X" / "who teaches X" style questions using
// the real timetable's faculty names — works without Gemini for names typed
// in Latin script. Names typed in another script (e.g. Devanagari) need the
// live Gemini call to resolve, since matching that offline would require a
// transliteration table this app doesn't ship.
function answerFacultyQuestion(message, context) {
  const lower = message.toLowerCase();
  const asksWhoIs = /\bwho\s+(is|are|teaches|handles)\b/.test(lower) || /\bwho'?s\b/.test(lower);
  if (!asksWhoIs || !context.timetableWeek?.length) return null;

  // Pull out plausible name tokens from the question (words after "who is/are/teaches/handles").
  const nameGuess = lower.replace(/\bwho\s+(is|are|teaches|handles)\b/, '').replace(/\bwho'?s\b/, '').trim();
  if (!nameGuess) return null;

  const matches = context.timetableWeek.filter((slot) =>
    slot.faculty_name && (
      slot.faculty_name.toLowerCase().includes(nameGuess) ||
      nameGuess.split(/\s+/).some((word) => word.length > 2 && slot.faculty_name.toLowerCase().includes(word))
    )
  );

  if (!matches.length) return null;

  const facultyName = matches[0].faculty_name;
  const subjects = [...new Set(matches.map((m) => `${m.subject_name || m.subject_code} (${m.day}, Period ${m.period_no})`))];
  return `${facultyName} teaches you ${subjects.join(' and ')}.`;
}

// Small set of canned answers used when neither the timetable shortcut above
// nor the live Gemini call can answer — e.g. quota exhausted, network hiccup,
// bad key, etc. This keeps the chat widget always responding with something
// useful instead of ever showing an error bubble.
const FALLBACK_RULES = [
  { keywords: ['event', 'events'], reply: "You can check out all upcoming events on the Events page from the navbar — it lists dates, venues, and lets you register directly." },
  { keywords: ['club', 'clubs', 'join'], reply: "Head to the Clubs page to see every club on campus and join the ones you're interested in with one click." },
  { keywords: ['placement', 'job', 'interview', 'practice', 'aptitude', 'coding', 'verbal'], reply: "The Practice Hub has aptitude, verbal, and coding practice questions by category and difficulty to help you prep." },
  { keywords: ['timetable', 'schedule', 'class', 'classes', 'subject', 'subjects', 'lecture'], reply: "Your class schedule is on the Dashboard under \"Today's Schedule\" — it shows every period for the day, including subject and faculty. You can also switch to the Full Week view there." },
  { keywords: ['profile', 'password', 'login', 'account'], reply: "You can update your details from the Profile page, and reset your password from the login screen if you're locked out." },
  { keywords: ['hi', 'hello', 'hey'], reply: "Hi! I'm your Freshers Portal assistant. Ask me about events, clubs, the Practice Hub, or your timetable." }
];

function getFallbackReply(message, context) {
  const periodAnswer = answerPeriodQuestion(message, context);
  if (periodAnswer) return periodAnswer;

  const facultyAnswer = answerFacultyQuestion(message, context);
  if (facultyAnswer) return facultyAnswer;

  const registrationAnswer = answerRegistrationIntent(message, context);
  if (registrationAnswer) return registrationAnswer;

  const lower = message.toLowerCase();
  const match = FALLBACK_RULES.find((rule) => rule.keywords.some((k) => lower.includes(k)));
  if (match) return match.reply;
  return "I'm here to help with events, clubs, the Practice Hub, and your timetable — try asking about one of those, or check the relevant page from the navbar.";
}

router.post('/chat', verifyToken(), async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Please type a message.' });
  }

  const context = await getStudentContext(req.user);

  if (!KEY_IS_CONFIGURED) {
    lastCallInfo.at = new Date().toISOString();
    lastCallInfo.ok = false;
    lastCallInfo.model = null;
    lastCallInfo.status = 'no_key';
    lastCallInfo.note = 'GEMINI_API_KEY missing/placeholder in server/.env';
    return res.json({ reply: getFallbackReply(message, context), fallback: true });
  }

  let lastError = null;
  let sawQuotaError = false;
  const systemPrompt = buildContextPrompt(context);

  for (const model of CANDIDATE_MODELS) {
    try {
      // The key must go in the `?key=` query parameter — this is what Google's
      // Generative Language API actually documents and reliably authenticates
      // with. An earlier version of this code sent it as an `x-goog-api-key`
      // header instead, which is NOT reliably honored by this endpoint and
      // produces a generic 401 "Expected OAuth 2 access token..." error even
      // with a perfectly valid key. Query-param auth is the correct fix.
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`,
        {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: message }] }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        lastCallInfo.at = new Date().toISOString();
        lastCallInfo.ok = true;
        lastCallInfo.model = model;
        lastCallInfo.status = 200;
        lastCallInfo.note = null;
        return res.json({ reply, model });
      }
      lastError = new Error('Empty response from model');
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      // 404 usually means that specific model name is retired/unavailable on this
      // API key/version — try the next candidate model instead of giving up.
      if (status === 404) {
        continue;
      }

      // 429 = rate limit / quota exceeded. This can be PER MODEL on the free tier,
      // so instead of giving up immediately we try the next candidate model —
      // e.g. gemini-2.5-flash's free quota can be exhausted while gemini-1.5-flash
      // still has room. Only if every model comes back with 429 do we report a
      // real quota problem to the user.
      if (status === 429) {
        sawQuotaError = true;
        continue;
      }

      // 400 with "API key not valid" or 401/403 means the key itself is the problem —
      // no point trying other models, fail fast with a clear message.
      if (status === 400 || status === 401 || status === 403) {
        break;
      }

      // Any other error (network, timeout, 500 from Google, etc.) — also stop and report.
      break;
    }
  }

  // Log the full error server-side for debugging, but never surface a raw
  // error to the chat widget — during a live demo, a grounded fallback reply
  // is much better than an error bubble in front of judges.
  const errData = lastError?.response?.data || lastError?.message || lastError;
  console.error('Chatbot error (falling back to canned reply):', errData);

  lastCallInfo.at = new Date().toISOString();
  lastCallInfo.ok = false;
  lastCallInfo.model = null;
  lastCallInfo.status = lastError?.response?.status || (sawQuotaError ? 429 : 'network_error');
  lastCallInfo.note = typeof errData === 'string' ? errData : (errData?.error?.message || lastError?.message || 'unknown error');

  res.json({ reply: getFallbackReply(message, context), fallback: true });
});

// Admin-only diagnostics: is a Gemini key configured, and what happened on the
// last live call? Much faster than digging through server logs to answer
// "why does the chatbot only give canned replies".
router.get('/status', verifyToken('admin'), (req, res) => {
  res.json({
    keyConfigured: KEY_IS_CONFIGURED,
    keyLength: KEY_IS_CONFIGURED ? GEMINI_KEY.length : 0,
    candidateModels: CANDIDATE_MODELS,
    lastCall: lastCallInfo
  });
});

export default router;
