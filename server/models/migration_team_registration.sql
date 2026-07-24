-- Run this ONCE against an existing freshers_portal database to add the new
-- "team / group registration" feature (team name + member list with
-- name/section/year for events and clubs) without losing existing data.
--
-- Usage:
--   mysql -u root -p freshers_portal < server/models/migration_team_registration.sql
--
-- If you are setting up the database for the first time instead, just run
-- schema.sql — it already includes these columns and this file is not needed.

USE freshers_portal;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS requires_team BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_size INT DEFAULT 1;

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS requires_team BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_size INT DEFAULT 1;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS team_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS members JSON NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS eligible_branches JSON NULL;
