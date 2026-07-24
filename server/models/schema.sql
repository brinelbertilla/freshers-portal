CREATE DATABASE IF NOT EXISTS freshers_portal;
USE freshers_portal;

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120),
  branch VARCHAR(20),
  year VARCHAR(10),
  section VARCHAR(5),
  interests JSON,
  profile_completed BOOLEAN DEFAULT FALSE,
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_lab BOOLEAN DEFAULT FALSE
);

-- Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch VARCHAR(20) NOT NULL,
  year VARCHAR(10) NOT NULL,
  section VARCHAR(5) NOT NULL,
  day VARCHAR(10) NOT NULL,
  period_no INT NOT NULL,
  subject_code VARCHAR(20),
  subject_name VARCHAR(150),
  faculty_name VARCHAR(100),
  is_lab BOOLEAN DEFAULT FALSE,
  UNIQUE KEY uniq_slot (branch, year, section, day, period_no)
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  incharge_name VARCHAR(100),
  time_slot VARCHAR(100),
  location VARCHAR(150),
  theme VARCHAR(150),
  category ENUM('technical','cultural','all') DEFAULT 'all',
  description TEXT,
  interest_tags JSON NULL,
  requires_team BOOLEAN DEFAULT FALSE,
  team_size INT DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  incharge_name VARCHAR(100),
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  place VARCHAR(150),
  purpose TEXT,
  category ENUM('technical','cultural','all') DEFAULT 'all',
  agenda TEXT,
  company VARCHAR(150),
  organizer VARCHAR(150),
  interest_tags JSON NULL,
  requires_team BOOLEAN DEFAULT FALSE,
  team_size INT DEFAULT 1,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  eligibility VARCHAR(255),
  max_active_backlogs INT DEFAULT 0,
  drive_type VARCHAR(50),
  package_lpa VARCHAR(50),
  logo VARCHAR(500),
  eligible_branches JSON NULL,
  notes TEXT
);

-- Placement Questions
CREATE TABLE IF NOT EXISTS placement_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('aptitude','verbal','coding') NOT NULL,
  difficulty ENUM('easy','medium','hard') DEFAULT 'easy',
  question TEXT NOT NULL,
  options JSON NULL,
  answer TEXT
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  item_type ENUM('event','club') NOT NULL,
  item_id INT NOT NULL,
  team_name VARCHAR(150) NULL,
  members JSON NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_reg (student_id, item_type, item_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  source_type ENUM('event','club','training') NOT NULL,
  source_id INT NOT NULL,
  fire_at DATETIME NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Programs
CREATE TABLE IF NOT EXISTS training_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(150) NOT NULL,
  program_date DATE NOT NULL,
  program_time TIME NOT NULL,
  agenda TEXT,
  company VARCHAR(150),
  organizer VARCHAR(150),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
