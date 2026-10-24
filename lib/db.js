import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SEED_REQUESTS } from './seed-data.js';

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS care_requests (
    id INTEGER PRIMARY KEY,
    reference_code TEXT NOT NULL UNIQUE,
    submitter_name TEXT,
    care_type TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_method TEXT NOT NULL,
    contact_detail TEXT,
    urgency TEXT NOT NULL CHECK (urgency IN ('routine', 'soon', 'urgent')),
    status TEXT NOT NULL CHECK (status IN ('received', 'in_review', 'assigned', 'completed')),
    assignee TEXT,
    member_note TEXT NOT NULL DEFAULT '',
    internal_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    requester_uid TEXT,
    requester_email TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_care_requests_open
    ON care_requests (status, urgency, created_at);

  DROP VIEW IF EXISTS member_request_status;
  CREATE VIEW member_request_status AS
  SELECT reference_code, care_type, status, member_note, updated_at
  FROM care_requests;

  DROP TRIGGER IF EXISTS care_requests_no_delete;
  CREATE TRIGGER care_requests_no_delete
  BEFORE DELETE ON care_requests
  BEGIN
    SELECT RAISE(ABORT, 'Care requests are archived, not deleted');
  END;
`;

const INSERT_SQL = `
  INSERT INTO care_requests (
    reference_code, submitter_name, care_type, description,
    contact_method, contact_detail, urgency, status, assignee,
    member_note, internal_note, created_at, updated_at, completed_at,
    requester_uid, requester_email
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

function blankToNull(value) {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

export function databaseFile() {
  if (process.env.CARE_DB_PATH) return process.env.CARE_DB_PATH;
  const directory = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.accessSync(directory, fs.constants.W_OK);
    return path.join(directory, 'care.sqlite');
  } catch {
    return path.join(os.tmpdir(), 'zion-care.sqlite');
  }
}

function ensureRequesterColumns(db) {
  const names = new Set(db.prepare('PRAGMA table_info(care_requests)').all().map((column) => column.name));
  if (!names.has('requester_uid')) db.exec('ALTER TABLE care_requests ADD COLUMN requester_uid TEXT');
  if (!names.has('requester_email')) db.exec('ALTER TABLE care_requests ADD COLUMN requester_email TEXT');
  db.exec('CREATE INDEX IF NOT EXISTS idx_care_requests_requester ON care_requests (requester_uid, created_at)');
}

export function migrate(db) {
  db.exec(SCHEMA_SQL);
  ensureRequesterColumns(db);
}

export function insertCareRequest(db, row) {
  db.prepare(INSERT_SQL).run(
    row.referenceCode,
    blankToNull(row.name),
    row.careType,
    row.description,
    row.contactMethod,
    blankToNull(row.contactDetail),
    row.urgency,
    row.status || 'received',
    blankToNull(row.assignee),
    row.memberNote || '',
    row.internalNote || '',
    row.createdAt,
    row.updatedAt || row.createdAt,
    row.completedAt || null,
    blankToNull(row.requesterUid),
    blankToNull(row.requesterEmail),
  );
}

export function seedDatabase(db) {
  db.exec('BEGIN');
  try {
    for (const row of SEED_REQUESTS) insertCareRequest(db, row);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM care_requests').get().n;
  if (count === 0) seedDatabase(db);
}

export function closeDb() {
  if (globalThis.__zionCareDb) {
    globalThis.__zionCareDb.close();
    globalThis.__zionCareDb = null;
  }
}

export function getDb() {
  if (globalThis.__zionCareDb) return globalThis.__zionCareDb;
  const file = databaseFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  seedIfEmpty(db);
  globalThis.__zionCareDb = db;
  return db;
}
