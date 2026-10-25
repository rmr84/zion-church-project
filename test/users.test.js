import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { closeDb } from '../lib/db.js';
import { getUserRole, saveUser, usersCollection } from '../lib/users.js';

process.env.MONGODB_DB = 'zion-care-test';

const uid = `usersTest${Date.now()}`;
const email = `users-test-${Date.now()}@example.com`;

after(async () => {
  try {
    const users = await usersCollection();
    await users.deleteOne({ uid });
  } finally {
    await closeDb();
  }
});

test('saveUser writes the requester and can mark the email confirmed', async () => {
  await saveUser({ uid, email, emailVerified: false });
  const users = await usersCollection();
  const created = await users.findOne({ uid }, { projection: { _id: 0 } });
  assert.equal(created.email, email);
  assert.equal(created.emailVerified, false);
  assert.equal(typeof created.createdAt, 'string');

  await users.updateOne({ uid }, { $set: { role: 'staff' } });
  await saveUser({ uid, email, emailVerified: true });
  const confirmed = await users.findOne({ uid }, { projection: { _id: 0 } });
  assert.equal(confirmed.emailVerified, true);
  assert.equal(confirmed.role, 'staff');
  assert.equal(await getUserRole(uid), 'staff');
  assert.equal(confirmed.createdAt, created.createdAt);
  assert.ok(confirmed.updatedAt >= created.updatedAt);
});
