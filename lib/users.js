import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mongoClient } from './db.js';
import { photoExtension } from './profile.js';
import { requesterUid } from './session-token.js';

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

export async function getUserRole(uid) {
  const id = requesterUid(uid);
  if (!id) return '';
  const users = await usersCollection();
  const doc = await users.findOne({ uid: id }, { projection: { _id: 0, role: 1 } });
  return doc?.role === 'staff' ? 'staff' : '';
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
