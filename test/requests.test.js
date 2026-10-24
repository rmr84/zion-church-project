import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { SCHEMA_SQL, insertCareRequest, migrate, seedDatabase } from '../lib/db.js';
import {
  MEMBER_FIELDS,
  createRequest,
  getMemberRequest,
  getStaffRequest,
  listRequesterRequests,
  listRequests,
  updateCareRequest,
} from '../lib/requests.js';

function openTestDb() {
  const db = new DatabaseSync(':memory:');
  migrate(db);
  return db;
}

function add(db, partial) {
  insertCareRequest(db, {
    name: 'Test Person',
    careType: 'other',
    description: 'A short description of the need.',
    contactMethod: 'phone',
    contactDetail: '555-0100',
    memberNote: '',
    internalNote: 'staff secret',
    assignee: null,
    status: 'received',
    completedAt: null,
    updatedAt: partial.createdAt,
    ...partial,
  });
}

test('member reads use a fixed column allowlist', () => {
  assert.deepEqual(MEMBER_FIELDS, [
    'reference_code',
    'care_type',
    'status',
    'member_note',
    'updated_at',
  ]);
});

test('the database rejects an unknown urgency', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA_SQL);
  assert.throws(() => {
    db.prepare(`
      INSERT INTO care_requests (
        reference_code, care_type, description, contact_method, urgency, status, created_at, updated_at
      ) VALUES ('ZC-BAD-0001', 'other', 'Hello there', 'phone', 'whenever', 'received', '2026-10-23T00:00:00.000Z', '2026-10-23T00:00:00.000Z')
    `).run();
  });
});

test('seeded member lookups hide staff notes, contact details, and the description', () => {
  const db = openTestDb();
  seedDatabase(db);

  const hospital = getMemberRequest('zc-hosp-1001', db);
  assert.equal(JSON.stringify(hospital).includes('Pastor Ellis'), false);
  assert.equal(JSON.stringify(hospital).includes('312'), false);
  assert.equal(JSON.stringify(hospital).includes('555-0148'), false);
  assert.equal(hospital.status, 'received');
  assert.equal(hospital.memberNote, '');

  const prayer = getMemberRequest('ZC-ANON-1003', db);
  assert.equal(JSON.stringify(prayer).toLowerCase().includes('diagnosis'), false);
  assert.match(prayer.memberNote, /prayer team/);

  const meal = getMemberRequest('ZC-MEAL-1002', db);
  assert.match(meal.memberNote, /meal team/);
  assert.equal(JSON.stringify(meal).includes('Ruth Alvarez'), false);
  assert.equal(JSON.stringify(meal).includes('porch code'), false);

  const staff = getStaffRequest('ZC-HOSP-1001', db);
  assert.match(staff.internalNote, /Pastor Ellis/);
  assert.match(staff.description, /room 312/);
});

test('urgency sort puts urgent before soon before routine, oldest first within a level', () => {
  const db = openTestDb();
  add(db, { referenceCode: 'ZC-AAA-0001', urgency: 'routine', createdAt: '2026-01-01T00:00:00.000Z' });
  add(db, { referenceCode: 'ZC-AAA-0002', urgency: 'urgent', createdAt: '2026-03-01T00:00:00.000Z' });
  add(db, { referenceCode: 'ZC-AAA-0003', urgency: 'soon', createdAt: '2026-02-01T00:00:00.000Z' });
  add(db, { referenceCode: 'ZC-AAA-0004', urgency: 'urgent', createdAt: '2026-01-15T00:00:00.000Z' });

  assert.deepEqual(
    listRequests({ db, sort: 'urgency' }).map((row) => row.referenceCode),
    ['ZC-AAA-0004', 'ZC-AAA-0002', 'ZC-AAA-0003', 'ZC-AAA-0001'],
  );
  assert.deepEqual(
    listRequests({ db, sort: 'newest' }).map((row) => row.referenceCode),
    ['ZC-AAA-0002', 'ZC-AAA-0003', 'ZC-AAA-0004', 'ZC-AAA-0001'],
  );
});

test('the seeded open queue is ordered for the demo', () => {
  const db = openTestDb();
  seedDatabase(db);
  assert.deepEqual(
    listRequests({ db, sort: 'urgency' }).map((row) => row.referenceCode),
    ['ZC-OTHR-1005', 'ZC-HOSP-1001', 'ZC-MEAL-1002', 'ZC-ANON-1003'],
  );
  assert.deepEqual(
    listRequests({ db, sort: 'newest' }).map((row) => row.referenceCode),
    ['ZC-HOSP-1001', 'ZC-OTHR-1005', 'ZC-MEAL-1002', 'ZC-ANON-1003'],
  );
  assert.deepEqual(
    listRequests({ db, archive: true }).map((row) => row.referenceCode),
    ['ZC-COUN-1004'],
  );
});

test('new requests ignore smuggled staff fields and retry a taken code', () => {
  const db = openTestDb();
  insertCareRequest(db, {
    referenceCode: 'ZC-TAKEN-001',
    name: 'Existing',
    careType: 'other',
    description: 'Already on file.',
    contactMethod: 'none',
    contactDetail: null,
    urgency: 'routine',
    status: 'received',
    assignee: null,
    memberNote: '',
    internalNote: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    completedAt: null,
  });

  const notices = [];
  const code = createRequest({
    name: '',
    careType: 'prayer_support',
    description: 'Room 14 diagnosis secret-phrase',
    contactMethod: 'phone',
    contactDetail: '555-0101',
    urgency: 'urgent',
    status: 'completed',
    assignee: 'Hacker',
    memberNote: 'visible smuggle',
    internalNote: 'should-not-stick',
    createdAt: '2000-01-01T00:00:00.000Z',
    requesterUid: 'attackeruid1234',
    requesterEmail: 'attacker@example.com',
  }, {
    db,
    notify: (body) => notices.push(body),
    codes: ['ZC-TAKEN-001', 'ZC-FRESH-001'],
  });

  assert.equal(code, 'ZC-FRESH-001');
  const staff = getStaffRequest(code, db);
  assert.equal(staff.status, 'received');
  assert.equal(staff.assignee, null);
  assert.equal(staff.memberNote, '');
  assert.equal(staff.internalNote, '');
  assert.equal(staff.name, null);
  assert.equal(staff.requesterEmail, null);
  assert.notEqual(staff.createdAt, '2000-01-01T00:00:00.000Z');
  assert.equal(notices.length, 1);
  assert.equal(notices[0].includes('secret-phrase'), false);
  assert.equal(notices[0].includes('555-0101'), false);
  assert.equal(notices[0].includes('should-not-stick'), false);
});

test('an account is stored only when the server passes one, and each person sees their own', () => {
  const db = openTestDb();
  const input = {
    name: 'Ada',
    careType: 'prayer_support',
    description: 'A private prayer request.',
    contactMethod: 'none',
    contactDetail: '',
    urgency: 'routine',
  };
  const owned = createRequest(input, {
    db,
    notify() {},
    codes: ['ZC-OWNR-0001'],
    account: { uid: 'firebaseUid1234', email: 'Ada@Zion.Example' },
  });
  const other = createRequest(input, {
    db,
    notify() {},
    codes: ['ZC-OTHR-0002'],
    account: { uid: 'otheruser123456', email: 'other@zion.example' },
  });

  assert.equal(owned, 'ZC-OWNR-0001');
  assert.equal(getStaffRequest(owned, db).requesterEmail, 'ada@zion.example');
  assert.equal(JSON.stringify(getMemberRequest(owned, db)).includes('ada@zion.example'), false);
  assert.deepEqual(listRequesterRequests('firebaseUid1234', db).map((row) => row.referenceCode), [owned]);
  assert.equal(listRequesterRequests('otheruser123456', db).some((row) => row.referenceCode === owned), false);
  assert.equal(listRequesterRequests('otheruser123456', db)[0].referenceCode, other);
  assert.deepEqual(listRequesterRequests('not-a-uid', db), []);
});

test('the member view has no staff columns and rows cannot be deleted', () => {
  const db = openTestDb();
  seedDatabase(db);
  const columns = db.prepare('PRAGMA table_info(member_request_status)').all().map((column) => column.name);
  assert.deepEqual(columns, [
    'reference_code',
    'care_type',
    'status',
    'member_note',
    'updated_at',
  ]);
  assert.throws(() => db.prepare('SELECT internal_note FROM member_request_status').get());
  assert.throws(() => db.prepare('SELECT requester_email FROM member_request_status').get());
  const before = db.prepare('SELECT COUNT(*) AS n FROM care_requests').get().n;
  assert.throws(() => db.prepare('DELETE FROM care_requests').run(), /archived, not deleted/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM care_requests').get().n, before);
});

test('completing a request archives it, keeps the row, and logs only the member note', () => {
  const db = openTestDb();
  seedDatabase(db);
  const before = db.prepare('SELECT COUNT(*) AS n FROM care_requests').get().n;
  const notices = [];

  updateCareRequest('ZC-HOSP-1001', {
    status: 'in_review',
    assignee: 'Pastor Ellis',
    memberNote: 'A pastor will visit this afternoon.',
    internalNote: 'PORCH-CODE-441',
  }, { db, notify: (body) => notices.push(body) });

  const member = getMemberRequest('ZC-HOSP-1001', db);
  assert.equal(member.status, 'in_review');
  assert.match(member.memberNote, /visit this afternoon/);
  assert.equal(JSON.stringify(member).includes('PORCH-CODE-441'), false);
  assert.equal(notices.length, 1);
  assert.match(notices[0], /In Review/);
  assert.match(notices[0], /visit this afternoon/);
  assert.equal(notices[0].includes('PORCH-CODE-441'), false);
  assert.equal(notices[0].includes('555-0148'), false);

  updateCareRequest('ZC-HOSP-1001', {
    status: 'in_review',
    assignee: 'Pastor Ellis',
    memberNote: 'A pastor will visit this afternoon.',
    internalNote: 'A different staff note',
  }, { db, notify: (body) => notices.push(body) });
  assert.equal(notices.length, 1);

  updateCareRequest('ZC-HOSP-1001', {
    status: 'completed',
    assignee: 'Pastor Ellis',
    memberNote: 'The visit happened.',
    internalNote: 'PORCH-CODE-441',
  }, { db, notify: (body) => notices.push(body) });

  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM care_requests').get().n, before);
  assert.equal(listRequests({ db }).some((row) => row.referenceCode === 'ZC-HOSP-1001'), false);
  assert.equal(listRequests({ db, archive: true }).some((row) => row.referenceCode === 'ZC-HOSP-1001'), true);
  assert.equal(getStaffRequest('ZC-HOSP-1001', db).status, 'completed');
  assert.equal(notices.length, 2);
  assert.equal(notices[1].includes('PORCH-CODE-441'), false);
});
