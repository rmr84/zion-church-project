import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { MEMBER_VIEW, REQUESTS, closeDb, getDb, insertCareRequest, seedDatabase } from '../lib/db.js';
import {
  MEMBER_FIELDS,
  createRequest,
  getMemberRequest,
  getStaffRequest,
  listRequesterRequests,
  listRequests,
  searchRequests,
  updateCareRequest,
} from '../lib/requests.js';

process.env.MONGODB_DB = 'zion-care-test';

after(async () => {
  await closeDb();
});

async function openTestDb() {
  const db = await getDb();
  await db.collection(REQUESTS).deleteMany({});
  return db;
}

async function add(db, partial) {
  await insertCareRequest(db, {
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

test('member reads use a fixed field allowlist', () => {
  assert.deepEqual(MEMBER_FIELDS, [
    'referenceCode',
    'careType',
    'status',
    'memberNote',
    'updatedAt',
  ]);
});

test('the database rejects an unknown urgency', async () => {
  const db = await openTestDb();
  await assert.rejects(() => insertCareRequest(db, {
    referenceCode: 'ZC-BAD-0001',
    careType: 'other',
    description: 'Hello there',
    contactMethod: 'phone',
    urgency: 'whenever',
    status: 'received',
    memberNote: '',
    internalNote: '',
    createdAt: '2026-10-23T00:00:00.000Z',
    updatedAt: '2026-10-23T00:00:00.000Z',
  }));
});

test('seeded member lookups hide staff notes, contact details, and the description', async () => {
  const db = await openTestDb();
  await seedDatabase(db);

  const hospital = await getMemberRequest('zc-hosp-1001', db);
  assert.equal(JSON.stringify(hospital).includes('Pastor Ellis'), false);
  assert.equal(JSON.stringify(hospital).includes('312'), false);
  assert.equal(JSON.stringify(hospital).includes('555-0148'), false);
  assert.equal(hospital.status, 'received');
  assert.equal(hospital.memberNote, '');

  const prayer = await getMemberRequest('ZC-ANON-1003', db);
  assert.equal(JSON.stringify(prayer).toLowerCase().includes('diagnosis'), false);
  assert.match(prayer.memberNote, /prayer team/);

  const meal = await getMemberRequest('ZC-MEAL-1002', db);
  assert.match(meal.memberNote, /meal team/);
  assert.equal(JSON.stringify(meal).includes('Ruth Alvarez'), false);
  assert.equal(JSON.stringify(meal).includes('porch code'), false);

  const staff = await getStaffRequest('ZC-HOSP-1001', db);
  assert.match(staff.internalNote, /Pastor Ellis/);
  assert.match(staff.description, /room 312/);
});

test('urgency sort puts urgent before soon before routine, oldest first within a level', async () => {
  const db = await openTestDb();
  await add(db, { referenceCode: 'ZC-AAA-0001', urgency: 'routine', createdAt: '2026-01-01T00:00:00.000Z' });
  await add(db, { referenceCode: 'ZC-AAA-0002', urgency: 'urgent', createdAt: '2026-03-01T00:00:00.000Z' });
  await add(db, { referenceCode: 'ZC-AAA-0003', urgency: 'soon', createdAt: '2026-02-01T00:00:00.000Z' });
  await add(db, { referenceCode: 'ZC-AAA-0004', urgency: 'urgent', createdAt: '2026-01-15T00:00:00.000Z' });

  assert.deepEqual(
    (await listRequests({ db, sort: 'urgency' })).map((row) => row.referenceCode),
    ['ZC-AAA-0004', 'ZC-AAA-0002', 'ZC-AAA-0003', 'ZC-AAA-0001'],
  );
  assert.deepEqual(
    (await listRequests({ db, sort: 'newest' })).map((row) => row.referenceCode),
    ['ZC-AAA-0002', 'ZC-AAA-0003', 'ZC-AAA-0004', 'ZC-AAA-0001'],
  );
});

test('the seeded open queue is ordered for the demo', async () => {
  const db = await openTestDb();
  await seedDatabase(db);
  assert.deepEqual(
    (await listRequests({ db, sort: 'urgency' })).map((row) => row.referenceCode),
    ['ZC-OTHR-1005', 'ZC-HOSP-1001', 'ZC-MEAL-1002', 'ZC-ANON-1003'],
  );
  assert.deepEqual(
    (await listRequests({ db, sort: 'newest' })).map((row) => row.referenceCode),
    ['ZC-HOSP-1001', 'ZC-OTHR-1005', 'ZC-MEAL-1002', 'ZC-ANON-1003'],
  );
  assert.deepEqual(
    (await listRequests({ db, archive: true })).map((row) => row.referenceCode),
    ['ZC-COUN-1004'],
  );
});

test('new requests ignore smuggled staff fields and retry a taken code', async () => {
  const db = await openTestDb();
  await insertCareRequest(db, {
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
  const code = await createRequest({
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
  const staff = await getStaffRequest(code, db);
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

test('an account is stored only when the server passes one, and each person sees their own', async () => {
  const db = await openTestDb();
  const input = {
    name: 'Ada',
    careType: 'prayer_support',
    description: 'A private prayer request.',
    contactMethod: 'none',
    contactDetail: '',
    urgency: 'routine',
  };
  const owned = await createRequest(input, {
    db,
    notify() {},
    codes: ['ZC-OWNR-0001'],
    account: { uid: 'firebaseUid1234', email: 'Ada@Zion.Example' },
  });
  const other = await createRequest(input, {
    db,
    notify() {},
    codes: ['ZC-OTHR-0002'],
    account: { uid: 'otheruser123456', email: 'other@zion.example' },
  });

  assert.equal(owned, 'ZC-OWNR-0001');
  assert.equal((await getStaffRequest(owned, db)).requesterEmail, 'ada@zion.example');
  assert.equal(JSON.stringify(await getMemberRequest(owned, db)).includes('ada@zion.example'), false);
  assert.deepEqual((await listRequesterRequests('firebaseUid1234', db)).map((row) => row.referenceCode), [owned]);
  assert.equal((await listRequesterRequests('otheruser123456', db)).some((row) => row.referenceCode === owned), false);
  assert.equal((await listRequesterRequests('otheruser123456', db))[0].referenceCode, other);
  assert.deepEqual(await listRequesterRequests('not-a-uid', db), []);
});

test('the member view has no staff fields', async () => {
  const db = await openTestDb();
  await seedDatabase(db);
  const [view] = await db.listCollections({ name: MEMBER_VIEW }).toArray();
  const projected = view.options.pipeline[0].$project;
  assert.deepEqual(
    Object.keys(projected).filter((key) => projected[key] === 1).sort(),
    ['careType', 'memberNote', 'referenceCode', 'status', 'updatedAt'],
  );
  const peeked = await db.collection(MEMBER_VIEW).findOne(
    { referenceCode: 'ZC-HOSP-1001' },
    { projection: { internalNote: 1, description: 1, requesterEmail: 1, _id: 0 } },
  );
  assert.equal(peeked.internalNote, undefined);
  assert.equal(peeked.description, undefined);
  assert.equal(peeked.requesterEmail, undefined);
  const before = await db.collection(REQUESTS).countDocuments();
  assert.equal(before, 5);
});

test('completing a request archives it, keeps the document, and logs only the member note', async () => {
  const db = await openTestDb();
  await seedDatabase(db);
  const before = await db.collection(REQUESTS).countDocuments();
  const notices = [];

  await updateCareRequest('ZC-HOSP-1001', {
    status: 'in_review',
    assignee: 'Pastor Ellis',
    memberNote: 'A pastor will visit this afternoon.',
    internalNote: 'PORCH-CODE-441',
  }, { db, notify: (body) => notices.push(body) });

  const member = await getMemberRequest('ZC-HOSP-1001', db);
  assert.equal(member.status, 'in_review');
  assert.match(member.memberNote, /visit this afternoon/);
  assert.equal(JSON.stringify(member).includes('PORCH-CODE-441'), false);
  assert.equal(notices.length, 1);
  assert.match(notices[0], /In Review/);
  assert.match(notices[0], /visit this afternoon/);
  assert.equal(notices[0].includes('PORCH-CODE-441'), false);
  assert.equal(notices[0].includes('555-0148'), false);

  await updateCareRequest('ZC-HOSP-1001', {
    status: 'in_review',
    assignee: 'Pastor Ellis',
    memberNote: 'A pastor will visit this afternoon.',
    internalNote: 'A different staff note',
  }, { db, notify: (body) => notices.push(body) });
  assert.equal(notices.length, 1);

  await updateCareRequest('ZC-HOSP-1001', {
    status: 'completed',
    assignee: 'Pastor Ellis',
    memberNote: 'The visit happened.',
    internalNote: 'PORCH-CODE-441',
  }, { db, notify: (body) => notices.push(body) });

  assert.equal(await db.collection(REQUESTS).countDocuments(), before);
  assert.equal((await listRequests({ db })).some((row) => row.referenceCode === 'ZC-HOSP-1001'), false);
  assert.equal((await listRequests({ db, archive: true })).some((row) => row.referenceCode === 'ZC-HOSP-1001'), true);
  assert.equal((await getStaffRequest('ZC-HOSP-1001', db)).status, 'completed');
  assert.equal(notices.length, 2);
  assert.equal(notices[1].includes('PORCH-CODE-441'), false);
});

test('search finds care requests by name, care type, or reference code', async () => {
  const db = await openTestDb();
  await add(db, {
    referenceCode: 'ZC-MEAL-2201',
    name: 'Ada Meal',
    careType: 'meal_delivery',
    description: 'Needs dinner this week.',
    createdAt: '2026-10-01T00:00:00.000Z',
  });
  await add(db, {
    referenceCode: 'ZC-PRAY-2202',
    name: 'Other Person',
    careType: 'prayer_support',
    description: 'A quiet request.',
    createdAt: '2026-10-02T00:00:00.000Z',
  });

  assert.deepEqual((await searchRequests('ada meal', db)).map((row) => row.referenceCode), ['ZC-MEAL-2201']);
  assert.deepEqual((await searchRequests('Meal Delivery', db)).map((row) => row.referenceCode), ['ZC-MEAL-2201']);
  assert.deepEqual((await searchRequests('zc-pray-2202', db)).map((row) => row.referenceCode), ['ZC-PRAY-2202']);
  assert.equal(await searchRequests('a', db).then((rows) => rows.length), 0);
  assert.equal(JSON.stringify(await searchRequests('dinner', db)).includes('Needs dinner'), false);
});
