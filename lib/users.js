import { randomBytes } from 'node:crypto';
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
  if (role === CARE_TEAM_ROLE) return 'Care Team';
  if (role === REQUESTER_ROLE) return 'Requester';
  return '';
}

export function memberInitials(firstName, lastName, email) {
  const first = String(firstName || '').trim().charAt(0);
  const last = String(lastName || '').trim().charAt(0);
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  const mark = String(email || '').trim().charAt(0);
  return mark ? mark.toUpperCase() : '?';
}

export function deskInvitePending(row) {
  if (!row) return false;
  if (row.inviteStatus === 'active') return false;
  if (row.inviteStatus === 'pending') return true;
  return Boolean(row.invitedAt);
}

export async function listDeskMembers() {
  const users = await usersCollection();
  const rows = await users.find(
    { role: { $in: [ADMIN_ROLE, 'admin', CARE_TEAM_ROLE] } },
    {
      projection: {
        _id: 0,
        uid: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        role: 1,
        photoType: 1,
        photoUpdatedAt: 1,
        invitedAt: 1,
        inviteStatus: 1,
      },
    },
  ).toArray();
  return rows.map((row) => {
    const name = [row.firstName, row.lastName].filter(Boolean).join(' ');
    const pending = deskInvitePending(row);
    return {
      uid: row.uid || '',
      email: row.email || '',
      name,
      label: name || row.email || 'Care Team',
      initials: memberInitials(row.firstName, row.lastName, row.email),
      role: roleLabel(row.role),
      status: pending ? 'pending' : 'active',
      photo: Boolean(row.photoType),
      photoUpdatedAt: row.photoUpdatedAt || '',
    };
  }).sort((left, right) => {
    const rank = (left.role === 'Admin' ? 0 : 1) - (right.role === 'Admin' ? 0 : 1);
    return rank || left.name.localeCompare(right.name) || left.email.localeCompare(right.email);
  });
}

export async function acceptDeskInvite(identity) {
  const id = requesterUid(identity?.uid);
  const email = String(identity?.email || '').trim().toLowerCase();
  if (!id && !email) return;
  const users = await usersCollection();
  const now = new Date().toISOString();
  const filter = id && email
    ? { $or: [{ uid: id }, { email }] }
    : id
      ? { uid: id }
      : { email };
  await users.updateOne(
    filter,
    {
      $set: {
        inviteStatus: 'active',
        updatedAt: now,
        ...(id ? { uid: id } : {}),
        ...(email ? { email } : {}),
      },
      $unset: {
        invitePassword: '',
        inviteRefreshToken: '',
      },
    },
  );
}

export async function deletePendingDeskUser({ uid = '', email = '' } = {}) {
  const id = requesterUid(uid);
  const address = String(email || '').trim().toLowerCase();
  if (!id && !address) {
    return { ok: false, formError: 'That user is not on file.' };
  }

  const users = await usersCollection();
  const filter = id && address
    ? { $or: [{ uid: id }, { email: address }] }
    : id
      ? { uid: id }
      : { email: address };
  const existing = await users.findOne(filter, {
    projection: {
      _id: 0,
      uid: 1,
      email: 1,
      role: 1,
      inviteStatus: 1,
      invitedAt: 1,
      photoType: 1,
      invitePassword: 1,
      inviteRefreshToken: 1,
    },
  });
  if (!existing) return { ok: false, formError: 'That user is not on file.' };
  if (!deskInvitePending(existing)) {
    return { ok: false, formError: 'Only pending invites can be deleted.' };
  }

  return {
    ok: true,
    email: existing.email || address,
    uid: existing.uid || '',
    photoType: existing.photoType || '',
    invitePassword: existing.invitePassword || '',
    inviteRefreshToken: existing.inviteRefreshToken || '',
  };
}

export async function removeDeskUserRecord({ uid = '', email = '' } = {}) {
  const id = requesterUid(uid);
  const address = String(email || '').trim().toLowerCase();
  if (!id && !address) {
    return { ok: false, formError: 'That user is not on file.' };
  }

  const users = await usersCollection();
  const result = await users.deleteOne(
    id && address
      ? { $or: [{ uid: id }, { email: address }] }
      : id
        ? { uid: id }
        : { email: address },
  );
  if (!result.deletedCount) return { ok: false, formError: 'That user could not be deleted.' };

  if (id) {
    try {
      await deleteProfilePhoto(id);
    } catch (error) {
      console.error('Could not remove the profile photo.', error?.code || error?.message || '');
    }
  }

  return { ok: true };
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

export async function inviteDeskUser({
  email,
  role,
  uid = '',
  firstName = '',
  lastName = '',
  invitePassword = '',
  inviteRefreshToken = '',
}) {
  const address = String(email || '').trim().toLowerCase();
  const nextRole = canonicalRole(role);
  const first = String(firstName || '').trim().slice(0, 80);
  const last = String(lastName || '').trim().slice(0, 80);
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 200) {
    return { ok: false, formError: 'Enter a valid email address.' };
  }
  if (!isDeskRole(nextRole)) {
    return { ok: false, formError: 'Choose Admin or Care Team.' };
  }

  const users = await usersCollection();
  const now = new Date().toISOString();
  const existing = await users.findOne(
    { email: address },
    { projection: { _id: 0, uid: 1, role: 1, inviteStatus: 1, invitedAt: 1 } },
  );
  if (existing) {
    if (deskInvitePending(existing)) {
      return { ok: false, formError: 'An invite for that email is already pending.' };
    }
    if (isDeskRole(existing.role)) {
      return { ok: false, formError: 'That person is already on the care desk.' };
    }
    return { ok: false, formError: 'An account with that email already exists.' };
  }

  const firebaseUid = requesterUid(uid);
  const nextUid = firebaseUid || `invite${randomBytes(12).toString('hex')}`;
  if (!requesterUid(nextUid)) {
    return { ok: false, formError: 'That account could not be prepared.' };
  }

  const fields = {
    email: address,
    role: nextRole,
    invitedAt: now,
    inviteStatus: 'pending',
    updatedAt: now,
  };
  if (first) fields.firstName = first;
  if (last) fields.lastName = last;
  if (invitePassword) fields.invitePassword = String(invitePassword);
  if (inviteRefreshToken) fields.inviteRefreshToken = String(inviteRefreshToken);

  try {
    await users.insertOne({
      uid: nextUid,
      firstName: first,
      lastName: last,
      emailVerified: false,
      createdAt: now,
      ...fields,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return { ok: false, formError: 'An account with that email already exists.' };
    }
    throw error;
  }

  return { ok: true, email: address, role: nextRole };
}
