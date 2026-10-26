import { CARE_TYPES, DESK_STATUSES, STATUSES, normalizeStatus } from './constants.js';
import { MEMBER_VIEW, REQUESTS, insertCareRequest, mongoClient } from './db.js';
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
  name: 1,
  careType: 1,
  description: 1,
  contactMethod: 1,
  contactDetail: 1,
  urgency: 1,
  status: 1,
  memberNote: 1,
  updatedAt: 1,
});

const URGENCY_RANK = { urgent: 0, soon: 1, routine: 2 };

function memberView(row) {
  return Object.freeze({
    referenceCode: row.referenceCode,
    name: row.name ?? null,
    careType: row.careType,
    description: row.description ?? '',
    contactMethod: row.contactMethod ?? '',
    contactDetail: row.contactDetail ?? null,
    urgency: row.urgency ?? '',
    status: normalizeStatus(row.status),
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
    status: normalizeStatus(row.status),
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

const LIVE_REQUESTS_DB = 'production';
const LIVE_REQUESTS = 'requests';
let retiredAssignedStatus = false;

async function requestStore(db) {
  if (db) return { db, collection: REQUESTS, memberCollection: MEMBER_VIEW };
  const client = await mongoClient();
  const store = {
    db: client.db(process.env.MONGODB_DB || LIVE_REQUESTS_DB),
    collection: LIVE_REQUESTS,
    memberCollection: LIVE_REQUESTS,
  };
  if (!retiredAssignedStatus) {
    retiredAssignedStatus = true;
    try {
      await store.db.collection(store.collection).updateMany(
        { status: 'assigned' },
        { $set: { status: 'in_review' } },
      );
    } catch (error) {
      console.error('Could not retire assigned statuses.', error?.code || error?.message || '');
    }
  }
  return store;
}

export async function getMemberRequest(code, db) {
  const store = await requestStore(db);
  const normalized = normalizeReferenceCode(code);
  if (!normalized) return null;
  const row = await store.db.collection(store.memberCollection).findOne(
    { referenceCode: normalized },
    { projection: MEMBER_PROJECTION },
  );
  return row ? memberView(row) : null;
}

export async function getStaffRequest(code, db) {
  const store = await requestStore(db);
  const normalized = normalizeReferenceCode(code);
  if (!normalized) return null;
  const row = await store.db.collection(store.collection).findOne({ referenceCode: normalized });
  return row ? staffView(row) : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function valuesMatching(options, term) {
  const needle = term.toLowerCase();
  return options
    .filter((option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle))
    .map((option) => option.value);
}

export async function searchRequests(query, db) {
  const term = String(query || '').trim().slice(0, 80);
  if (term.length < 2) return [];
  const store = await requestStore(db);
  const expression = { $regex: escapeRegex(term), $options: 'i' };
  const careTypes = valuesMatching(CARE_TYPES, term);
  const statuses = [...new Set([
    ...valuesMatching(STATUSES, term),
    ...valuesMatching(DESK_STATUSES, term),
  ])];
  const or = [
    { referenceCode: expression },
    { name: expression },
    { description: expression },
    { requesterEmail: expression },
    { assignee: expression },
    { contactDetail: expression },
  ];
  if (careTypes.length) or.push({ careType: { $in: careTypes } });
  if (statuses.length) or.push({ status: { $in: statuses } });

  const rows = await store.db.collection(store.collection).find(
    { $or: or },
    { projection: { _id: 0, referenceCode: 1, name: 1, careType: 1, status: 1, updatedAt: 1 } },
  ).sort({ updatedAt: -1 }).limit(8).toArray();

  return rows.map((row) => ({
    referenceCode: row.referenceCode,
    name: row.name || 'Name not given',
    careType: row.careType,
    status: row.status,
  }));
}

export async function listRequests({ archive = false, sort = 'urgency', db } = {}) {
  const store = await requestStore(db);
  const filter = archive ? { status: 'completed' } : { status: { $ne: 'completed' } };
  const rows = (await store.db.collection(store.collection).find(filter).toArray()).map(staffView);
  if (sort === 'newest') return rows.sort((left, right) => compareCreated(right, left));
  if (sort === 'oldest') return rows.sort(compareCreated);
  return rows.sort((left, right) => {
    const rank = (URGENCY_RANK[left.urgency] ?? 3) - (URGENCY_RANK[right.urgency] ?? 3);
    return rank || compareCreated(left, right);
  });
}

export async function createRequest(input, options = {}) {
  const store = await requestStore(options.db);
  const notify = options.notify || logNotice;
  const codes = options.codes || referenceCodes();
  const now = new Date().toISOString();
  let attempts = 0;

  for (const code of codes) {
    attempts += 1;
    if (attempts > 5) break;
    try {
      const account = requesterIdentity(options.account?.uid, options.account?.email);
      await insertCareRequest(store.db, {
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
      }, store.collection);
      try {
        await notify(buildConfirmation({ referenceCode: code, careType: input.careType }));
      } catch (error) {
        console.error('Could not log the confirmation notice.', error?.code || error?.message || '');
      }
      return code;
    } catch (error) {
      if (!isUniqueError(error)) throw error;
    }
  }

  throw new Error('Could not generate a unique reference code');
}

export async function listRequesterRequests(uid, db) {
  const store = await requestStore(db);
  const id = requesterUid(uid);
  if (!id) return [];
  const rows = await store.db.collection(store.collection).find(
    { $or: [{ requesterUid: id }, { uid: id }] },
    { projection: { ...MEMBER_PROJECTION, description: 1, urgency: 1, createdAt: 1 } },
  ).sort({ createdAt: -1 }).toArray();
  return rows.map((row) => Object.freeze({
    referenceCode: row.referenceCode,
    name: row.name ?? null,
    careType: row.careType,
    description: row.description ?? '',
    contactMethod: row.contactMethod ?? '',
    contactDetail: row.contactDetail ?? null,
    urgency: row.urgency ?? '',
    status: row.status,
    memberNote: row.memberNote ?? '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getRequesterOwnedRequest(code, uid, db) {
  const store = await requestStore(db);
  const id = requesterUid(uid);
  const normalized = normalizeReferenceCode(code);
  if (!id || !normalized) return null;
  const row = await store.db.collection(store.collection).findOne(
    {
      referenceCode: normalized,
      $or: [{ requesterUid: id }, { uid: id }],
    },
    {
      projection: {
        _id: 0,
        referenceCode: 1,
        name: 1,
        careType: 1,
        description: 1,
        contactMethod: 1,
        contactDetail: 1,
        urgency: 1,
        status: 1,
        memberNote: 1,
        createdAt: 1,
        updatedAt: 1,
        completedAt: 1,
        requesterEmail: 1,
      },
    },
  );
  if (!row) return null;
  return Object.freeze({
    referenceCode: row.referenceCode,
    name: row.name ?? null,
    careType: row.careType,
    description: row.description ?? '',
    contactMethod: row.contactMethod ?? '',
    contactDetail: row.contactDetail ?? null,
    urgency: row.urgency ?? '',
    status: normalizeStatus(row.status),
    memberNote: row.memberNote ?? '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt ?? null,
    requesterEmail: row.requesterEmail ?? null,
  });
}

export async function updateCareRequest(code, changes, options = {}) {
  const store = await requestStore(options.db);
  const notify = options.notify || logNotice;
  const current = await getStaffRequest(code, options.db);
  if (!current) return null;

  const now = new Date().toISOString();
  const completedAt = changes.status === 'completed' ? current.completedAt || now : null;

  await store.db.collection(store.collection).updateOne(
    { referenceCode: current.referenceCode },
    {
      $set: {
        status: normalizeStatus(changes.status),
        assignee: changes.assignee ? changes.assignee : null,
        memberNote: changes.memberNote || '',
        internalNote: changes.internalNote || '',
        updatedAt: now,
        completedAt,
      },
    },
  );

  if (changes.status !== current.status) {
    try {
      await notify(buildStatusNotice({
        referenceCode: current.referenceCode,
        careType: current.careType,
        status: changes.status,
        memberNote: changes.memberNote,
      }));
    } catch (error) {
      console.error('Could not log the status notice.', error?.code || error?.message || '');
    }
  }

  return getStaffRequest(current.referenceCode, options.db);
}
