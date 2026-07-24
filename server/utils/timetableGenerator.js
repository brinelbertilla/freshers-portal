// Generates a full, conflict-free weekly timetable for every department/section
// of the 1st-year (freshers) common curriculum.
//
// Usage as a library:   import { generateAllTimetables, PERIOD_TIMES } from './timetableGenerator.js'
// Usage standalone:     node utils/timetableGenerator.js   (writes straight to the DB)

import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Departments (alphabetical) & sections this timetable is generated for.
// These are 1st-year subjects, so we only generate Year "1" — every branch
// shares the same first-year common curriculum, just with its own faculty.
// ---------------------------------------------------------------------------
export const BRANCHES = ['AIDS', 'AIML', 'CIVIL', 'CSBS', 'CSE', 'ECE', 'EEE', 'EIE', 'ICE', 'MECH'];
export const SECTIONS = ['A', 'B'];
export const YEAR = '1';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Full daily period/break/lunch layout, purely for display purposes on the client.
export const PERIOD_TIMES = [
  { period_no: 1, label: '1st', start: '9:15 AM', end: '10:05 AM' },
  { period_no: 2, label: '2nd', start: '10:05 AM', end: '10:55 AM' },
  { type: 'break', label: 'Break', start: '10:55 AM', end: '11:05 AM' },
  { period_no: 3, label: '3rd', start: '11:05 AM', end: '11:55 AM' },
  { period_no: 4, label: '4th', start: '11:55 AM', end: '12:45 PM' },
  { type: 'lunch', label: 'Lunch', start: '12:45 PM', end: '1:25 PM' },
  { period_no: 5, label: '5th', start: '1:25 PM', end: '2:15 PM' },
  { period_no: 6, label: '6th', start: '2:15 PM', end: '3:05 PM' },
  { type: 'break', label: 'Break', start: '3:05 PM', end: '3:15 PM' },
  { period_no: 7, label: '7th', start: '3:15 PM', end: '4:00 PM' },
  { period_no: 8, label: '8th', start: '4:00 PM', end: '4:45 PM' }
];

// Lecture (non-lab) periods each day. Periods 5 & 6 (right after lunch) are
// reserved for the daily 2-period lab session.
const LECTURE_PERIODS = [1, 2, 3, 4, 7, 8];
const LAB_PERIODS = [5, 6];

// ---------------------------------------------------------------------------
// Subjects (weekly period count must add up to 30 = 6 lecture periods x 5 days)
// ---------------------------------------------------------------------------
export const SUBJECTS = [
  { code: '25MA101', short: 'MA', name: 'Engineering Mathematics', weekly: 4 },
  { code: '25EN101', short: 'EN', name: 'Professional English', weekly: 3 },
  { code: '25LN101', short: 'LN', name: 'Language', weekly: 2 },
  { code: '25PH101', short: 'PH', name: 'Engineering Physics', weekly: 3 },
  { code: '25CH101', short: 'CH', name: 'Engineering Chemistry', weekly: 3 },
  { code: '25ES101', short: 'PY', name: 'Problem Solving and Python Programming', weekly: 4 },
  { code: '25ES102', short: 'EG', name: 'Engineering Graphics', weekly: 3 },
  { code: '25TP101', short: 'TPA', name: 'Training and Placement (Aptitude)', weekly: 2 },
  { code: '25TP102', short: 'TPV', name: 'Training and Placement (Verbal)', weekly: 2 },
  { code: '25PD101', short: 'PD', name: 'Personality Development', weekly: 1 },
  { code: '25SS101', short: 'SS', name: 'Soft Skill', weekly: 2 },
  { code: '25LI101', short: 'LIB', name: 'Library', weekly: 1 }
];
const SUBJECT_BY_SHORT = Object.fromEntries(SUBJECTS.map((s) => [s.short, s]));

// One 2-period lab per day, rotating through the week. Lab codes are derived
// from their parent subject's code with an "L" suffix.
export const LAB_ORDER = [
  { code: '25ES101L', name: 'Python Programming Lab', parentShort: 'PY' },
  { code: '25PH101L', name: 'Engineering Physics Lab', parentShort: 'PH' },
  { code: '25CH101L', name: 'Engineering Chemistry Lab', parentShort: 'CH' },
  { code: '25ES102L', name: 'Engineering Graphics Lab', parentShort: 'EG' },
  { code: '25EN101L', name: 'English Language Lab', parentShort: 'EN' }
];

// ---------------------------------------------------------------------------
// Base weekly grid (day -> period -> subject short code) for the 30 lecture
// slots. Hand-laid-out so every subject hits its exact weekly count and no
// subject repeats twice on the same day.
// ---------------------------------------------------------------------------
// Every period-column (1,2,3,4,7,8) here has 5 DISTINCT subjects across the
// week's rows — this is what guarantees that after day-rotation, a given
// (subject, real-day, real-period) combination is only ever produced by ONE
// rotation offset "k", so at most 4 sections (one k-group) ever need the
// same subject at the same moment — safely inside the 7-person faculty pool.
const BASE_WEEK = [
  { 1: 'MA', 2: 'PY', 3: 'EN', 4: 'PH', 7: 'CH', 8: 'EG' },  // Monday
  { 1: 'PY', 2: 'MA', 3: 'LN', 4: 'EN', 7: 'PH', 8: 'CH' },  // Tuesday
  { 1: 'EG', 2: 'TPA', 3: 'MA', 4: 'PY', 7: 'TPV', 8: 'SS' }, // Wednesday
  { 1: 'EN', 2: 'LN', 3: 'PH', 4: 'MA', 7: 'PY', 8: 'TPA' }, // Thursday
  { 1: 'CH', 2: 'EG', 3: 'TPV', 4: 'PD', 7: 'SS', 8: 'LIB' }  // Friday
];

// ---------------------------------------------------------------------------
// Faculty roster: 7 unique faculty per subject (and its lab, sharing the
// same pool). Names are auto-generated so every one of the 12*7 = 84
// faculty members across the college is unique.
// ---------------------------------------------------------------------------
const TAMIL_FIRST_NAMES = [
  'Karthick', 'Priya', 'Dinesh', 'Anu', 'Kavya', 'Arjun', 'Meena', 'Suresh',
  'Divya', 'Vignesh', 'Lakshmi', 'Ramesh', 'Anitha', 'Saravanan', 'Deepa',
  'Prakash', 'Revathi', 'Senthil', 'Kalaivani', 'Manikandan', 'Nithya',
  'Balaji', 'Swathi', 'Gokul', 'Aishwarya', 'Vijay', 'Preethi', 'Muthu',
  'Bhuvaneswari', 'Rajesh', 'Kavitha', 'Elango', 'Sangeetha', 'Sathish',
  'Yamuna', 'Karthik', 'Malathi', 'Selvam', 'Geetha', 'Ashok'
];
const TITLES = ['Dr.', 'Prof.', 'Mr.', 'Ms.'];
const INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let nameCounter = 0;
function nextFacultyName() {
  const first = TAMIL_FIRST_NAMES[nameCounter % TAMIL_FIRST_NAMES.length];
  const initial = INITIALS[Math.floor(nameCounter / TAMIL_FIRST_NAMES.length) % INITIALS.length];
  const title = TITLES[nameCounter % TITLES.length];
  nameCounter++;
  return `${title} ${first} ${initial}.`;
}

// facultyPool[subjectShort] = [7 unique names]
const facultyPool = {};
for (const subj of SUBJECTS) {
  facultyPool[subj.short] = Array.from({ length: 7 }, () => nextFacultyName());
}

export function getFacultyRoster() {
  return SUBJECTS.map((s) => ({ subject: s.name, code: s.code, faculty: facultyPool[s.short] }));
}

// ---------------------------------------------------------------------------
// Generation. Each (department, section) combination gets a day-rotated copy
// of BASE_WEEK/LAB_ORDER (rotation offset "k"). Rotating by whole days keeps
// each timetable internally consistent while giving every branch/section a
// visibly different weekly layout. Because only 5 distinct offsets exist and
// there are 20 (branch, section) combinations, at most 4 sections ever need
// the same subject at the same day+period simultaneously — safely under the
// 7-person faculty pool, so no single faculty member is ever double-booked.
// ---------------------------------------------------------------------------

// usage[subjectShort][day][period] = how many sections have already been
// assigned a faculty member for this exact (subject, day, period) slot.
function makeUsageTracker() {
  const usage = {};
  for (const short of Object.keys(facultyPool)) {
    usage[short] = {};
    for (const day of DAYS) usage[short][day] = {};
  }
  return usage;
}

function pickFaculty(usage, short, day, period) {
  const pool = facultyPool[short];
  const used = usage[short][day][period] || 0;
  const faculty = pool[used % pool.length];
  usage[short][day][period] = used + 1;
  return faculty;
}

export function generateAllTimetables() {
  const usage = makeUsageTracker();
  const rows = [];

  BRANCHES.forEach((branch, deptIndex) => {
    SECTIONS.forEach((section, sectionIndex) => {
      const k = (deptIndex * 2 + sectionIndex) % DAYS.length;

      DAYS.forEach((day, dayIndex) => {
        const sourceDayIndex = (dayIndex + k) % DAYS.length;
        const dayGrid = BASE_WEEK[sourceDayIndex];
        const lab = LAB_ORDER[sourceDayIndex];

        // Lecture periods
        LECTURE_PERIODS.forEach((period) => {
          const short = dayGrid[period];
          const subject = SUBJECT_BY_SHORT[short];
          const faculty = pickFaculty(usage, short, day, period);
          rows.push({
            branch, year: YEAR, section, day, period_no: period,
            subject_code: subject.code, subject_name: subject.name,
            faculty_name: faculty, is_lab: false
          });
        });

        // Lab periods (both periods share the same faculty & lab session)
        const labFaculty = pickFaculty(usage, lab.parentShort, day, LAB_PERIODS[0]);
        LAB_PERIODS.forEach((period) => {
          rows.push({
            branch, year: YEAR, section, day, period_no: period,
            subject_code: lab.code, subject_name: lab.name,
            faculty_name: labFaculty, is_lab: true
          });
        });
      });
    });
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Standalone CLI usage: `node utils/timetableGenerator.js` writes directly to DB.
// ---------------------------------------------------------------------------
async function runStandalone() {
  const { default: pool } = await import('../config/db.js');
  const rows = generateAllTimetables();

  console.log(`Generating ${rows.length} timetable slots for ${BRANCHES.length} departments x ${SECTIONS.length} sections...`);

  await pool.query('DELETE FROM timetable');
  for (const r of rows) {
    await pool.query(
      `INSERT INTO timetable (branch, year, section, day, period_no, subject_code, subject_name, faculty_name, is_lab)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.branch, r.year, r.section, r.day, r.period_no, r.subject_code, r.subject_name, r.faculty_name, r.is_lab]
    );
  }

  console.log(`✓ Timetable generated for: ${BRANCHES.join(', ')} (sections ${SECTIONS.join('/')}), Year ${YEAR}`);
  process.exit(0);
}

const isMain = process.argv[1] && process.argv[1].endsWith('timetableGenerator.js');
if (isMain) {
  runStandalone().catch((err) => {
    console.error('Failed to generate timetable:', err.message);
    process.exit(1);
  });
}
