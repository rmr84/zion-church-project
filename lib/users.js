import { mongoClient } from './db.js';

export const USERS = 'users';
const USERS_DATABASE = 'production';

let indexedFor = '';

export function usersDatabaseName() {
  return process.env.MONGODB_DB || USERS_DATABASE;
}

export async function usersCollection() {
  const name = usersDatabaseName();
  const client = await mongoClient();
  const users = client.db(name).collection(USERS);
  if (indexedFor !== name) {
    await users.createIndex({ uid: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    indexedFor = name;
  }
  return users;
}

export async function saveUser(identity) {
  const users = await usersCollection();
  const now = new Date().toISOString();
  const fields = {
    email: identity.email,
    emailVerified: identity.emailVerified === true,
    updatedAt: now,
  };
  try {
    await users.updateOne(
      { uid: identity.uid },
      { $set: fields, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await users.updateOne({ email: identity.email }, { $set: { uid: identity.uid, ...fields } });
  }
}
