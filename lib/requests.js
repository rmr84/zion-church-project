import { MEMBER_VIEW, REQUESTS, getDb, insertCareRequest } from './db.js';
import { buildConfirmation, buildStatusNotice, logNotice } from './notify.js';
import { normalizeReferenceCode, referenceCodes } from './reference.js';
import { requesterIdentity, requesterUid } from './session-token.js';

// Fields a member is allowed to see. Staff-only data is not in this list.
export const MEMBER_FIELDS = Object.freeze([
  'referenceCode',
  'careType',
  'status',
  'memberNote',
  'updatedAt',
]);

export const STAFF_FIELDS = Object.freeze([
  'referenceCode',
  'name',
  'careType',
  'description',
  'contactMethod',
  'contactDetail',
  'urgency',
  'status',
  'assignee',
  'memberNote',
  'internalNote',
  'createdAt',
  'updatedAt',
  'completedAt',
  'requesterEmail',
]);

const MEMBER_PROJECTION = Object.freeze({
  _id: 0,
  referenceCode: 1,
  careType: 1,
  status: 1,
  memberNote: 1,
  updatedAt: 1,
});

const URGENCY_RANK = { urgent: 0, soon: 1, routine: 2 };

function memberView(row) {
  return Object.freeze({
    referenceCode: row.referenceCode,
    careType: row.careType,
    status: row.status,
    memberNote: row.memberNote ?? '',
    updatedAt: row.updatedAt,
  });
}

function staffView(row) {
  return Object.freeze({
    referenceCode: row.referenceCode,
    name: row.name ?? null,
    careType: row.careType,
    description: row.description,
    contactMethod: row.contactMethod,
    contactDetail: row.contactDetail ?? null,
    urgency: row.urgency,
    status: row.status,
    assignee: row.assignee ?? null,
    memberNote: row.memberNote ?? '',
    internalNote: row.internalNote ?? '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt ?? null,
    requesterEmail: row.requesterEmail ?? null,
  });
}

function isUniqueError(error) {
  return error?.code === 11000 || String(error?.message || '').includes('E11000');
}

function compareCreated(left, right) {
  return String(left.createdAt).localeCompare(String(right.createdAt));
}

export async function getMemberRequest(code, db) {
  const database = db || await getDb();
  const normalized = normalizeReferenceCode(code);
  if (!normalized) return null;
  const row = await database.collection(MEMBER_VIEW).findOne(
    { referenceCode: normalized },
    { projection: MEMBER_PROJECTION },
  );
  return row ? memberView(row) : null;
}

export async function getStaffRequest(code, db) {
  const database = db || await getDb();
  const normalized = normalizeReferenceCode(code);
  if (!normalized) return null;
  const row = await database.collection(REQUESTS).findOne({ referenceCode: normalized });
  return row ? staffView(row) : null;
}

export async function listRequests({ archive = false, sort = 'urgency', db } = {}) {
  const database = db || await getDb();
  const filter = archive ? { status: 'completed' } : { status: { $ne: 'completed' } };
  const rows = (await database.collection(REQUESTS).find(filter).toArray()).map(staffView);
  if (sort === 'newest') return rows.sort((left, right) => compareCreated(right, left));
  if (sort === 'oldest') return rows.sort(compareCreated);
  return rows.sort((left, right) => {
    const rank = (URGENCY_RANK[left.urgency] ?? 3) - (URGENCY_RANK[right.urgency] ?? 3);
    return rank || compareCreated(left, right);
  });
}

export async function createRequest(input, options = {}) {
  const db = options.db || await getDb();
  const notify = options.notify || logNotice;
  const codes = options.codes || referenceCodes();
  const now = new Date().toISOString();
  let attempts = 0;

  for (const code of codes) {
    attempts += 1;
    if (attempts > 5) break;
    try {
      const account = requesterIdentity(options.account?.uid, options.account?.email);
      await insertCareRequest(db, {
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

export async function listRequesterRequests(uid, db) {
  const database = db || await getDb();
  const id = requesterUid(uid);
  if (!id) return [];
  const rows = await database.collection(REQUESTS).find(
    { requesterUid: id },
    { projection: { ...MEMBER_PROJECTION, createdAt: 1 } },
  ).sort({ createdAt: -1 }).toArray();
  return rows.map((row) => Object.freeze({
    referenceCode: row.referenceCode,
    careType: row.careType,
    status: row.status,
    memberNote: row.memberNote ?? '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function updateCareRequest(code, changes, options = {}) {
  const db = options.db || await getDb();
  const notify = options.notify || logNotice;
  const current = await getStaffRequest(code, db);
  if (!current) return null;

  const now = new Date().toISOString();
  const completedAt = changes.status === 'completed' ? current.completedAt || now : null;

  await db.collection(REQUESTS).updateOne(
    { referenceCode: current.referenceCode },
    {
      $set: {
        status: changes.status,
        assignee: changes.assignee ? changes.assignee : null,
        memberNote: changes.memberNote || '',
        internalNote: changes.internalNote || '',
        updatedAt: now,
        completedAt,
      },
    },
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
