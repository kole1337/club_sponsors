const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');
const raw = new DatabaseSync(dbPath);
raw.exec('PRAGMA journal_mode = WAL;');
raw.exec('PRAGMA foreign_keys = ON;');

// Thin wrapper giving a better-sqlite3-like surface (prepare/exec/transaction).
const db = {
  _raw: raw,
  exec: (sql) => raw.exec(sql),
  prepare: (sql) => raw.prepare(sql),
  transaction(fn) {
    return (...args) => {
      raw.exec('BEGIN');
      try {
        const result = fn(...args);
        raw.exec('COMMIT');
        return result;
      } catch (err) {
        raw.exec('ROLLBACK');
        throw err;
      }
    };
  },
};

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clubs (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  profile_image         TEXT,
  bio                   TEXT NOT NULL DEFAULT '',
  description_md        TEXT NOT NULL DEFAULT '',
  city                  TEXT NOT NULL DEFAULT '',
  affiliation           TEXT NOT NULL DEFAULT '',
  founding_year         INTEGER,
  member_count          INTEGER,
  contact_email         TEXT NOT NULL DEFAULT '',
  phone                 TEXT NOT NULL DEFAULT '',
  website               TEXT NOT NULL DEFAULT '',
  socials               TEXT NOT NULL DEFAULT '[]',
  open_to_sponsorship   INTEGER NOT NULL DEFAULT 1,
  sponsorship_needs     TEXT NOT NULL DEFAULT '[]',
  sponsorship_pitch     TEXT NOT NULL DEFAULT '',
  achievements          TEXT NOT NULL DEFAULT '',
  past_sponsors         TEXT NOT NULL DEFAULT '',
  sponsorship_contact   TEXT NOT NULL DEFAULT '',
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS club_admins (
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL DEFAULT 'admin',
  PRIMARY KEY (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_fields (
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  field   TEXT NOT NULL,
  PRIMARY KEY (club_id, field)
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id   INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  caption   TEXT NOT NULL DEFAULT '',
  sort      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id      INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL,
  phone        TEXT NOT NULL DEFAULT '',
  budget       TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'new',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_club_fields_field ON club_fields(field);
CREATE INDEX IF NOT EXISTS idx_gallery_club ON gallery_images(club_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_club ON inquiries(club_id);
`);

module.exports = db;
