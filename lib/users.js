import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mongoClient } from './db.js';
import { photoExtension } from './profile.js';
import { requesterUid } from './session-token.js';

export const USERS = 'users';
export const REQUESTER_ROLE = 'requester';
export const CARE_TEAM_ROLE = 'careTeam';
export const ADMIN_ROLE = 'Admin';
const USERS_DATABASE = 'production';

export function canonicalRole(value) {
  if (value === CARE_TEAM_ROLE) return CARE_TEAM_ROLE;
  if (value === ADMIN_ROLE || value === 'admin') return ADMIN_ROLE;
  if (value === REQUESTER_ROLE) return REQUESTER_ROLE;
  return '';
}

export function isDeskRole(value) {
  const role = canonicalRole(value);
  return role === ADMIN_ROLE || role === CARE_TEAM_ROLE;
}

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

const PHOTO_DIR = path.join(process.cwd(), 'data', 'profile-photos');

export function publicProfile(doc) {
  if (!doc) return null;
  return {
    email: doc.email || '',
    firstName: doc.firstName || '',
    lastName: doc.lastName || '',
    phone: doc.phone || '',
    emailNotifications: doc.emailNotifications !== false,
    inAppNotifications: doc.inAppNotifications !== false,
    photoType: doc.photoType || '',
    photoUpdatedAt: doc.photoUpdatedAt || '',
  };
}

export async function getUser(uid) {
  const id = requesterUid(uid);
  if (!id) return null;
  const users = await usersCollection();
  const doc = await users.findOne({ uid: id }, { projection: { _id: 0 } });
  return publicProfile(doc);
}

export function roleLabel(value) {
  const role = canonicalRole(value);
  if (role === ADMIN_ROLE) return 'Admin';
  if (role === CARE_TEAM_ROLE) return 'Care team';
  if (role === REQUESTER_ROLE) return 'Requester';
  return '';
}

export async function listDeskMembers() {
  const users = await usersCollection();
  const rows = await users.find(
    { role: { $in: [ADMIN_ROLE, 'admin', CARE_TEAM_ROLE] } },
    { projection: { _id: 0, email: 1, firstName: 1, lastName: 1, role: 1 } },
  ).toArray();
  return rows.map((row) => {
    const name = [row.firstName, row.lastName].filter(Boolean).join(' ');
    return {
      email: row.email || '',
      name: name || 'Name not given',
      role: roleLabel(row.role),
    };
  }).sort((left, right) => {
    const rank = (left.role === 'Admin' ? 0 : 1) - (right.role === 'Admin' ? 0 : 1);
    return rank || left.name.localeCompare(right.name) || left.email.localeCompare(right.email);
  });
}

export async function getUserRole(uid) {
  const id = requesterUid(uid);
  if (!id) return '';
  const users = await usersCollection();
  const doc = await users.findOne({ uid: id }, { projection: { _id: 0, role: 1 } });
  return canonicalRole(doc?.role);
}

export async function updateUserProfile(uid, email, fields) {
  const users = await usersCollection();
  const now = new Date().toISOString();
  await users.updateOne(
    { uid },
    {
      $set: { ...fields, email, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

export function profilePhotoPath(uid, type) {
  const extension = photoExtension(type);
  const id = requesterUid(uid);
  if (!id || !extension) return '';
  return path.join(PHOTO_DIR, `${id}.${extension}`);
}

export async function saveProfilePhoto(uid, bytes, type) {
  const destination = profilePhotoPath(uid, type);
  if (!destination) throw new Error('The picture could not be stored.');
  await mkdir(PHOTO_DIR, { recursive: true });
  const id = requesterUid(uid);
  await Promise.all(['png', 'jpg', 'gif', 'svg'].filter((extension) => !destination.endsWith(`.${extension}`)).map((extension) => (
    rm(path.join(PHOTO_DIR, `${id}.${extension}`), { force: true })
  )));
  await writeFile(destination, bytes);
}

export async function deleteProfilePhoto(uid) {
  const id = requesterUid(uid);
  if (!id) return;
  await Promise.all(['png', 'jpg', 'gif', 'svg'].map((extension) => (
    rm(path.join(PHOTO_DIR, `${id}.${extension}`), { force: true })
  )));
}

export async function readProfilePhoto(uid, type) {
  const file = profilePhotoPath(uid, type);
  if (!file) return null;
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

export async function saveUser(identity, options = {}) {
  const users = await usersCollection();
  const now = new Date().toISOString();
  const fields = {
    email: identity.email,
    emailVerified: identity.emailVerified === true,
    updatedAt: now,
  };
  const insert = { createdAt: now };
  if (options.role === REQUESTER_ROLE) insert.role = REQUESTER_ROLE;
  try {
    await users.updateOne(
      { uid: identity.uid },
      { $set: fields, $setOnInsert: insert },
      { upsert: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await users.updateOne({ email: identity.email }, { $set: { uid: identity.uid, ...fields } });
  }
}
