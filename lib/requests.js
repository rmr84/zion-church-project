import { getDb, insertCareRequest } from './db.js';
import { buildConfirmation, buildStatusNotice, logNotice } from './notify.js';
import { normalizeReferenceCode, referenceCodes } from './reference.js';
import { requesterIdentity, requesterUid } from './session-token.js';

// Columns a member is allowed to see. Staff-only data is not in this list.
export const MEMBER_FIELDS = Object.freeze([
  'reference_code',
  'care_type',
  'status',
  'member_note',
  'updated_at',
]);

export const STAFF_FIELDS = Object.freeze([
  'reference_code',
  'submitter_name',
  'care_type',
  'description',
  'contact_method',
  'contact_detail',
  'urgency',
  'status',
  'assignee',
  'member_note',
  'internal_note',
  'created_at',
  'updated_at',
  'completed_at',
  'requester_email',
]);

const ORDER = {
  urgency: `CASE urgency WHEN 'urgent' THEN 0 WHEN 'soon' THEN 1 WHEN 'routine' THEN 2 ELSE 3 END ASC, created_at ASC`,
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
};

function memberView(row) {
  return Object.freeze({
    referenceCode: row.reference_code,
    careType: row.care_type,
    status: row.status,
    memberNote: row.member_note ?? '',
    updatedAt: row.updated_at,
  });
}

function staffView(row) {
  return Object.freeze({
    referenceCode: row.reference_code,
    name: row.submitter_name,
    careType: row.care_type,
    description: row.description,
    contactMethod: row.contact_method,
    contactDetail: row.contact_detail,
    urgency: row.urgency,
    status: row.status,
    assignee: row.assignee,
    memberNote: row.member_note ?? '',
    internalNote: row.internal_note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    requesterEmail: row.requester_email,
  });
}

function isUniqueError(error) {
  const message = String(error?.message || '');
  return message.includes('UNIQUE constraint failed') || error?.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export function getMemberRequest(code, db = getDb()) {
  const normalized = normalizeReferenceCode(code);
  if (!normalized) return null;
  const row = db.prepare(
    `SELECT ${MEMBER_FIELDS.join(', ')} FROM member_request_status WHERE reference_code = ?`,
  ).get(normalized);
  return row ? memberView(row) : null;
}

export function getStaffRequest(code, db = getDb()) {
  const normalized = normalizeReferenceCode(code);
  if (!normalized) return null;
  const row = db.prepare(
    `SELECT ${STAFF_FIELDS.join(', ')} FROM care_requests WHERE reference_code = ?`,
  ).get(normalized);
  return row ? staffView(row) : null;
}

export function listRequests({ archive = false, sort = 'urgency', db = getDb() } = {}) {
  const order = ORDER[sort] || ORDER.urgency;
  const where = archive ? "status = 'completed'" : "status != 'completed'";
  return db.prepare(
    `SELECT ${STAFF_FIELDS.join(', ')} FROM care_requests WHERE ${where} ORDER BY ${order}`,
  ).all().map(staffView);
}

export function createRequest(input, options = {}) {
  const db = options.db || getDb();
  const notify = options.notify || logNotice;
  const codes = options.codes || referenceCodes();
  const now = new Date().toISOString();
  let attempts = 0;

  for (const code of codes) {
    attempts += 1;
    if (attempts > 5) break;
    try {
      const account = requesterIdentity(options.account?.uid, options.account?.email);
      insertCareRequest(db, {
        ...input,
        referenceCode: code,
        status: 'received',
        assignee: null,
        memberNote: '',
        internalNote: '',
        requesterUid: account?.uid || null,
        requesterEmail: account?.email || null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      });
      notify(buildConfirmation({ referenceCode: code, careType: input.careType }));
      return code;
    } catch (error) {
      if (!isUniqueError(error)) throw error;
    }
  }

  throw new Error('Could not generate a unique reference code');
}

export function listRequesterRequests(uid, db = getDb()) {
  const id = requesterUid(uid);
  if (!id) return [];
  return db.prepare(`
    SELECT reference_code, care_type, status, member_note, created_at, updated_at
    FROM care_requests
    WHERE requester_uid = ?
    ORDER BY created_at DESC
  `).all(id).map((row) => Object.freeze({
    referenceCode: row.reference_code,
    careType: row.care_type,
    status: row.status,
    memberNote: row.member_note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function updateCareRequest(code, changes, options = {}) {
  const db = options.db || getDb();
  const notify = options.notify || logNotice;
  const current = getStaffRequest(code, db);
  if (!current) return null;

  const now = new Date().toISOString();
  const completedAt = changes.status === 'completed' ? current.completedAt || now : null;

  db.prepare(`
    UPDATE care_requests
    SET status = ?, assignee = ?, member_note = ?, internal_note = ?, updated_at = ?, completed_at = ?
    WHERE reference_code = ?
  `).run(
    changes.status,
    changes.assignee ? changes.assignee : null,
    changes.memberNote || '',
    changes.internalNote || '',
    now,
    completedAt,
    current.referenceCode,
  );

  if (changes.status !== current.status) {
    notify(buildStatusNotice({
      referenceCode: current.referenceCode,
      careType: current.careType,
      status: changes.status,
      memberNote: changes.memberNote,
    }));
  }

  return getStaffRequest(current.referenceCode, db);
}
