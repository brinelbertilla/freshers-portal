# 🎓 Freshers Portal

> ⚠️ **Important naming note:** the *project folder* is called `freshers-portal` (with a
> hyphen) — that's just its folder/zip name, nothing to do with the database.
> The *database* is always called `freshers_portal` (with an **underscore**). These are two
> different things. Never rename the database — always keep it exactly `freshers_portal`
> with an underscore, or the app won't connect to it.

## What's new in this version

- **Chatbot: typo-tolerant + can now answer "who is X" faculty questions.** Fixed a regex bug where a typo like "3dr period" (meant "3rd") wasn't recognized at all. Also added faculty-name lookup — asking "who is Dinesh" (or "who teaches Dinesh Kumar") now checks the student's full week timetable and answers which subject(s) that person teaches them, and when. This works offline for names typed in Latin script; names typed in another script (e.g. Devanagari) need a live Gemini call to resolve, since offline matching can't transliterate.
  - **Double-check your key:** the `.env` in the version you sent back has `GEMINI_API_KEY=` blank. Since this is mandatory for you, make sure your real key is saved in `server/.env` (not `.env.example`) and the server's been restarted — then check **Admin Dashboard → chatbot tab** to confirm it's detected.
- **Placement companies now cover every department, not just IT.** Added real recruiters with logos for Civil (L&T Construction, Shapoorji Pallonji, Tata Projects), Mech (Ashok Leyland, Tata Motors, Mahindra, Bosch), EEE/EIE/ICE (Siemens, ABB, Schneider Electric, BHEL, Honeywell, Emerson, Yokogawa), ECE (Qualcomm, Texas Instruments), and CSBS/business-adjacent (Deloitte, EY, Capgemini) — alongside the existing IT names. Each company can be tagged with which branch(es) it recruits from; students see a "Recruiting [my branch] / All companies" toggle on the Placement page, and the admin company form now has branch checkboxes plus full edit/delete (previously add-only).
- **Registration form now applies to every event and club, not just team ones.** Previously, solo (1-person) events skipped straight to "Registered" with no details collected. Now every registration — solo or team — opens the same in-portal form asking name, **branch/course**, year, and section; team ones additionally ask for a team name and one row per member. Admin Dashboard → Events/Clubs tabs now have a **"View Registrants" / "View Members"** button on each row that expands to show exactly who signed up and their branch/year/section.
- **Sidebar navigation.** Replaced the horizontal top navbar with a vertical sidebar (Dashboard/Events/Clubs/Placement/Profile), using Playfair Display for the portal name and page headings for a more formal look. Collapses to a horizontal scrollable bar on narrow/mobile screens.
- **New color theme.** Replaced the indigo/blue palette with a pastel sage-green + dark charcoal combination, closer to the reference UI you shared.
- **Login/signup pages redesigned** with a split-panel layout and an original illustration of students studying on the left, matching the reference style. (If you'd rather use your own photo instead of the illustration, send it over and it can be swapped in.)

### If you already have an existing database from before this update

Run the migration once — it's safe to run even if you already ran it before, and adds:
- team-registration columns (`requires_team`, `team_size`, `team_name`, `members`)
- the new `eligible_branches` column on `companies` (used for the branch-specific recruiter filtering above)

```bash
mysql -u root -p freshers_portal < server/models/migration_team_registration.sql
```
(Windows/XAMPP: `"C:\xampp\mysql\bin\mysql" -u root -p freshers_portal < server\models\migration_team_registration.sql`)

If you're setting the database up **for the first time**, just run `schema.sql` as usual — it already includes all of the above, and you don't need the migration file at all.

## Previous updates

- **Chatbot key-trimming fix + diagnostics tab.** The key is read straight from `process.env` with whitespace/quote trimming applied once at startup, and **Admin Dashboard → "chatbot" tab** shows whether a key is detected (and its length), which Gemini models are being tried, and the exact result/error of the last message anyone sent.
- **The chatbot answers questions grounded in your data** — "what's my second period on Wednesday", "am I already registered for X", "how do I join Y" all resolve from the real database (timetable/events/clubs/registrations for the logged-in student), both when Gemini is available and in the offline fallback mode.
- **Team/group registration ("Google Form" style, built into the portal).** When creating an event or club, an admin can tick "Requires team/group registration" and set a team size — see above, this now also applies to solo registrations.
- **Admin login is created automatically by `npm run seed`** — no more separate `create-admin` command with a username/password to remember. Default login: **admin / Portal123!** (shown in the terminal after seeding, change it later if this goes anywhere public).
- Removed the duplicate "bubble" menu on the student dashboard (the Events/Clubs/Placement cards that repeated the navbar links).
- Student dashboard reordered: Today's Schedule → Picked for you → Notifications.
- "Today's Schedule" is a real row(days)/column(periods) timetable — 8 periods, both breaks, and lunch, with a Today/Full Week toggle. Every department (10, see below) and section (A/B) has its own generated 1st-year timetable with 7 unique faculty per subject and zero double-booked faculty.
- "Picked for you" recommends events/clubs matching the interests the student picked during profile setup.
- Notifications now only show a small "✕" dismiss icon in the corner for **past** notifications; upcoming ones have no dismiss control. New events/clubs also now broadcast a notification the moment an admin creates them (not just same-day reminders).
- Profile setup page rebuilt to spec: Branch (10 departments, alphabetical), Year (1st–4th), Section (A/B), "What are you into?" interest picker, and the submit button now reads **"Enter the Portal."**
- Admin Dashboard → "students" tab: every registered student with their branch/year/section and which events/clubs they've signed up for.
- Welcome poster banner — put your poster image in `client/public/images/welcome-poster.jpg` and it will show at the very top of the student dashboard, right after login. See `client/public/images/README.txt` for exact steps.

A full-stack web app for college freshers: events, clubs, placement prep, timetable,
notifications and an AI chatbot — with a separate admin dashboard.

**Stack:** React + Vite (frontend) · Node.js + Express (backend) · MySQL (database)

This guide assumes you know **basic coding but nothing about running a full project**.
Follow it top to bottom, in order, and don't skip steps.

---

## 0. What you need installed first

1. **Node.js** (v16 or newer) → https://nodejs.org (download the "LTS" version, install it like any program)
2. **MySQL** → easiest option for beginners is **XAMPP**: https://www.apachefriends.org
   (it includes MySQL + a UI called phpMyAdmin)
3. **VS Code** → https://code.visualstudio.com

Check Node installed correctly by opening a terminal (Command Prompt / Terminal / VS Code's
built-in terminal) and running:
```bash
node -v
npm -v
```
You should see version numbers, not an error.

---

## 1. Unzip the project

Extract `freshers-portal.zip` into a folder on your computer, e.g. `Documents/freshers-portal`.
Open that folder in VS Code: **File → Open Folder**.

You will see two main folders:
```
freshers-portal/
├── server/   ← backend (API + database logic)
└── client/   ← frontend (what users see in the browser)
```

Open a terminal in VS Code: **Terminal → New Terminal**. You'll use TWO terminals total
(one for the backend, one for the frontend) — you can open a second one with the **+** icon.

---

## 2. Start MySQL and create the database (all from VS Code's terminal)

1. Open **XAMPP Control Panel** → click **Start** next to **MySQL**. Leave that panel open in the background — you don't need to open Apache or any browser page.

2. In VS Code, open a terminal set to **Command Prompt** (not PowerShell):
   - Click the dropdown arrow next to the **+** icon in the terminal panel → choose **Command Prompt**
   - If you don't see that option: click the **+** dropdown → **Select Default Profile** → choose **Command Prompt** → open a new terminal

3. Make sure you're in the project's root folder (the one containing both `server` and `client`), then run:
   ```bash
   "C:\xampp\mysql\bin\mysql" -u root -p < server\models\schema.sql
   ```
   - It will ask for a password — if you're on default XAMPP, just **press Enter** (no password set)
   - No output = it worked
   - *(If your XAMPP is installed somewhere other than `C:\xampp`, adjust that path — run `dir "C:\xampp\mysql\bin"` first to confirm `mysql.exe` is there)*

This single command creates the `freshers_portal` database and every table it needs — no browser, no copy-pasting SQL anywhere.

### If you ever need to start over with a clean database

```bash
"C:\xampp\mysql\bin\mysql" -u root -p -e "DROP DATABASE IF EXISTS freshers_portal;"
"C:\xampp\mysql\bin\mysql" -u root -p < server\models\schema.sql
```
The first command wipes it, the second rebuilds it fresh. Both run right in the same VS Code terminal.

---

## 3. Set up the backend

In your first VS Code terminal:

```bash
cd server
npm install
```
This downloads all the backend libraries (takes a minute or two).

Now create your real environment file:
```bash
# Windows (Command Prompt):
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Open the new `server/.env` file and edit it:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          ← your MySQL password (blank if using default XAMPP)
DB_NAME=freshers_portal
JWT_SECRET=please_change_this_to_any_long_random_string
PORT=5000
GEMINI_API_KEY=       ← optional, only needed for the chatbot (see step 6)
SMTP_USER=            ← optional, only needed for "forgot password" emails
SMTP_PASS=
```
You can leave `GEMINI_API_KEY`, `SMTP_USER`, and `SMTP_PASS` blank for now — everything
else works fine without them.

Now load the sample data — this single command creates every table's sample rows
**and your admin login**, so it's the only setup command you need to run:
```bash
npm run seed
```
Watch the terminal output — near the end you'll see:
```
✓ Default admin created — username: admin / password: Portal123!
```
That's your Admin Dashboard login. Change the password later from inside MySQL/phpMyAdmin
if you're putting this anywhere other than your own laptop — there's no separate
"create admin" step to run, seeding handles it for you.

Finally, start the backend server:
```bash
npm run dev
```
You should see: `🚀 Server running on http://localhost:5000`
**Leave this terminal running** — don't close it.

---

## 4. Set up the frontend

Open a **second** terminal in VS Code (click the **+** icon in the terminal panel):

```bash
cd client
npm install
```

Create the frontend's environment file:
```bash
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```
The default value inside (`VITE_API_URL=http://localhost:5000/api`) is already correct —
no need to edit it.

Start the frontend:
```bash
npm run dev
```
You should see something like: `Local: http://localhost:5173/`
**Leave this terminal running too.**

---

## 5. Open the app

Go to **http://localhost:5173** in your browser.

- Click **"Create a Student Account"** to sign up as a student, or
- Go to **/admin/login** and log in with the admin username/password you created in step 3.

Both the backend (`localhost:5000`) and frontend (`localhost:5173`) terminals need to keep
running while you use the app. To stop them, click inside the terminal and press `Ctrl + C`.

---

## 6. Add your Freshers Party poster

1. Save your poster image as a **.jpg** file.
2. Rename it to exactly: `welcome-poster.jpg`
3. Copy it into: `client/public/images/`
4. Refresh the browser (or restart the frontend: `Ctrl+C` then `npm run dev` in the `client` terminal).
5. Log in as a student — the poster now appears at the very top of the dashboard, above everything else, with a small ✕ button to dismiss it for that session.

If your image is a `.png` instead, name it `welcome-poster.png` and change one line in
`client/src/pages/StudentDashboard.jsx`: find `src="/images/welcome-poster.jpg"` and change
`.jpg` to `.png`.

If no poster file is present, that section just won't show — nothing breaks.

## 7. Optional: enable the AI chatbot

The chatbot uses Google's Gemini API (free tier available).

1. Get a free API key at https://aistudio.google.com/app/apikey
2. Paste it into `server/.env` as `GEMINI_API_KEY=your_key_here` — make sure this is the real
   `server/.env` file (not `server/.env.example`), with no quotes around the key.
3. Restart the backend terminal (`Ctrl + C`, then `npm run dev` again) — Node only reads
   `.env` once at startup, so a running server won't pick up a key you just pasted in.

The backend automatically tries a few current Gemini model names in order (Google
periodically retires old ones), so it should keep working without code changes.

**If it's still only giving canned/generic replies**, log in as admin and open
**Admin Dashboard → chatbot tab**. It tells you, live:
- whether a key is detected at all, and its length (so you can eyeball whether the whole key
  got pasted in, not a truncated fragment)
- which models were tried
- the exact success/failure and error message from the *last* message any student sent

That's almost always faster than digging through server logs. The most common causes, in
order of likelihood: key pasted into `.env.example` instead of `.env`; server not restarted
after editing `.env`; or the Google Cloud project's free-tier quota being shared across all
keys created under that same project (a "new" key from the same account doesn't reset it).

Without a key, the rest of the app works fine — the chatbot just uses built-in offline
replies (it can still answer timetable/event/club/registration questions directly from the
database; it just won't have open-ended conversational ability).

## 8. Optional: enable "forgot password" emails

1. Use a Gmail account and create an **App Password** (Google Account → Security → 2-Step
   Verification → App Passwords). A normal Gmail password will NOT work here.
2. In `server/.env`, set:
   ```
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=your_16_character_app_password
   ```
3. Restart the backend.

---

## Project structure reference

```
freshers-portal/
├── server/                  Backend (Node.js + Express)
│   ├── config/db.js         MySQL connection pool
│   ├── middleware/auth.js   JWT authentication
│   ├── routes/              API endpoints (auth, events, clubs, placement, admin, ...)
│   ├── utils/                seed.js, createAdmin.js, mailer.js, notificationScheduler.js
│   ├── models/schema.sql    Full database schema
│   ├── .env                 Your local secrets (created by you, not in the zip)
│   └── server.js            App entry point
│
├── client/                  Frontend (React + Vite)
│   ├── src/components/      Navbar, NotificationList, Timetable, ChatbotWidget
│   ├── src/pages/           Landing, Login/Signup, Dashboard, Events, Clubs, Placement, Admin...
│   ├── src/api/axios.js     Configured API client (adds your login token automatically)
│   ├── src/styles/global.css Pastel color theme used across the app
│   └── .env                 Points the frontend at your backend URL
│
└── README.md                 This file
```

## Timetable — how it was generated

- Covers all **10 departments** (alphabetical): AIDS, AIML, CIVIL, CSBS, CSE, ECE, EEE, EIE, ICE, MECH — each with **sections A & B** (20 timetables total).
- It's generated for **Year 1 only**, since the subject list you gave (Engineering Mathematics, Physics, Chemistry, Python Programming, Engineering Graphics, Professional English, Language, TP-Aptitude, TP-Verbal, Personality Development, Soft Skill, Library) is the standard 1st-year common curriculum — that's what a "Freshers Portal" is for. If you also need Year 2–4 timetables, tell me the subjects/codes for those years and I'll extend the generator.
- Daily layout matches exactly what you specified: 1st (9:15–10:05) through 8th (4:00–4:45), with both breaks and lunch in between.
- Periods 5 & 6 each day are a 2-period lab, rotating **Python → Physics → Chemistry → Engineering Graphics → English** across Monday–Friday.
- Each subject has **7 auto-generated faculty** (Tamil names). The generator is mathematically verified so **no faculty member is ever double-booked** across any department/section at the same day+period — see `server/utils/timetableGenerator.js` for the full logic and comments.
- To regenerate the timetable on its own (without re-seeding everything else): `cd server && node utils/timetableGenerator.js`.

## Troubleshooting


- **"Failed to fetch" / network errors in the browser** → make sure the backend terminal
  is still running and shows no errors.
- **"Access denied for user 'root'@'localhost'"** → your `DB_PASSWORD` in `server/.env`
  doesn't match your actual MySQL password.
- **"Table doesn't exist"** → you skipped step 2 (running `schema.sql`), or ran it against
  the wrong database.
- **Port already in use** → something else is using port 5000 or 5173. Either close that
  program, or change `PORT` in `server/.env` (and update `VITE_API_URL` in `client/.env`
  to match).
- **npm install is slow or fails** → check your internet connection; it needs to download
  packages from the npm registry.
- **"Unknown column 'requires_team'" or similar** → your database was created before this
  update. Run the migration in the "already have an existing database" section above.
