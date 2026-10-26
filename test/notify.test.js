import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { closeDb } from '../lib/db.js';
import {
  buildStatusNotice,
  listEmailLogEntries,
  logNotice,
  notificationsCollection,
} from '../lib/notify.js';

process.env.MONGODB_DB = 'zion-care-test';

after(async () => {
  try {
    const collection = await notificationsCollection();
    await collection.deleteMany({ body: 'Hello from the desk' });
  } finally {
    await closeDb();
  }
});

test('status mail omits staff-only fields even if they are passed in', () => {
  const text = buildStatusNotice({
    referenceCode: 'ZC-TEST-0001',
    careType: 'meal_delivery',
    status: 'in_review',
    memberNote: 'We will call today.',
    internalNote: 'PORCH-CODE-441',
    description: 'Room 312 diagnosis',
  });

  assert.match(text, /In Review/);
  assert.match(text, /We will call today/);
  assert.equal(text.includes('PORCH-CODE-441'), false);
  assert.equal(text.includes('Room 312'), false);
  assert.match(text, /not sent|address omitted|Private care team notes/);
});

test('the email stub is written to the notifications collection', async () => {
  await logNotice('Hello from the desk');
  const entries = await listEmailLogEntries();
  assert.ok(entries.some((entry) => entry.includes('EMAIL (not sent)')));
  assert.ok(entries.some((entry) => entry.includes('Hello from the desk')));
});
