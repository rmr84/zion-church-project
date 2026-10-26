import { ObjectId } from 'mongodb';
import { CARE_TYPES, labelFor } from './constants.js';
import { mongoClient } from './db.js';
import { findMember, memberValue } from './members.js';
import { listDeskMembers } from './users.js';

export const DESK_NOTIFICATIONS = 'desk_notifications';
export const ASSIGNMENT_NOTIFICATION = 'assignment';
const LIVE_DB = 'production';

function notificationsDatabaseName() {
  return process.env.MONGODB_DB || LIVE_DB;
}

export async function deskNotificationsCollection() {
  const client = await mongoClient();
  const collection = client.db(notificationsDatabaseName()).collection(DESK_NOTIFICATIONS);
  await collection.createIndex({ recipientUid: 1, seen: 1, createdAt: -1 });
  await collection.createIndex({ type: 1, createdAt: -1 });
  return collection;
}

function notificationView(row) {
  return {
    id: row.id || (row._id ? String(row._id) : ''),
    type: row.type || ASSIGNMENT_NOTIFICATION,
    referenceCode: row.referenceCode || '',
    careType: row.careType || '',
    careLabel: labelFor(CARE_TYPES, row.careType),
    recipientUid: row.recipientUid || '',
    assignedBy: row.assignedBy || '',
    createdAt: row.createdAt || '',
    seen: row.seen === true,
  };
}

function notificationObjectId(id) {
  try {
    return new ObjectId(String(id || ''));
  } catch {
    return null;
  }
}

export async function createAssignmentNotification({
  assignee,
  previousAssignee = '',
  referenceCode,
  careType,
  assignedByUid = '',
  assignedByLabel = '',
} = {}) {
  const next = String(assignee || '').trim();
  const previous = String(previousAssignee || '').trim();
  if (!next || next === previous || !referenceCode) return { ok: false, skipped: true };

  const members = await listDeskMembers();
  const member = findMember(members, next);
  if (!member?.uid) return { ok: false, skipped: true };
  if (assignedByUid && member.uid === assignedByUid) return { ok: false, skipped: true };

  const previousMember = previous ? findMember(members, previous) : null;
  if (previousMember?.uid && previousMember.uid === member.uid) {
    return { ok: false, skipped: true };
  }

  const collection = await deskNotificationsCollection();
  await collection.insertOne({
    type: ASSIGNMENT_NOTIFICATION,
    recipientUid: member.uid,
    recipientEmail: member.email || '',
    recipientLabel: member.label || memberValue(member),
    referenceCode,
    careType: careType || '',
    assignedBy: assignedByLabel || '',
    assignedByUid: assignedByUid || '',
    createdAt: new Date().toISOString(),
    seen: false,
  });
  return { ok: true };
}

export async function countUnseenAssignmentNotifications(uid) {
  const id = String(uid || '').trim();
  if (!id) return 0;
  const collection = await deskNotificationsCollection();
  return collection.countDocuments({
    type: ASSIGNMENT_NOTIFICATION,
    recipientUid: id,
    seen: { $ne: true },
  });
}

export async function listUnseenAssignmentNotifications(uid) {
  const id = String(uid || '').trim();
  if (!id) return [];
  const collection = await deskNotificationsCollection();
  const rows = await collection.find(
    {
      type: ASSIGNMENT_NOTIFICATION,
      recipientUid: id,
      seen: { $ne: true },
    },
    {
      projection: {
        type: 1,
        referenceCode: 1,
        careType: 1,
        assignedBy: 1,
        createdAt: 1,
        seen: 1,
        recipientUid: 1,
      },
    },
  ).sort({ createdAt: -1 }).toArray();
  return rows.map((row) => notificationView({ ...row, id: String(row._id) }));
}

export async function markAssignmentNotificationSeen(id, uid) {
  const objectId = notificationObjectId(id);
  const recipientUid = String(uid || '').trim();
  if (!objectId || !recipientUid) {
    return { ok: false, formError: 'That notification is not on file.' };
  }
  const collection = await deskNotificationsCollection();
  const result = await collection.updateOne(
    {
      _id: objectId,
      type: ASSIGNMENT_NOTIFICATION,
      recipientUid,
      seen: { $ne: true },
    },
    { $set: { seen: true } },
  );
  if (!result.matchedCount) {
    return { ok: false, formError: 'That notification is not on file.' };
  }
  return { ok: true };
}

export async function markAssignmentNotificationsSeen(ids, uid) {
  const recipientUid = String(uid || '').trim();
  const objectIds = (Array.isArray(ids) ? ids : [])
    .map((id) => notificationObjectId(id))
    .filter(Boolean);
  if (!recipientUid || objectIds.length === 0) {
    return { ok: false, formError: 'Select at least one notification.' };
  }
  const collection = await deskNotificationsCollection();
  await collection.updateMany(
    {
      _id: { $in: objectIds },
      type: ASSIGNMENT_NOTIFICATION,
      recipientUid,
      seen: { $ne: true },
    },
    { $set: { seen: true } },
  );
  return { ok: true };
}

export async function markAllAssignmentNotificationsSeen(uid) {
  const recipientUid = String(uid || '').trim();
  if (!recipientUid) return { ok: false, formError: 'Sign in again to update notifications.' };
  const collection = await deskNotificationsCollection();
  await collection.updateMany(
    {
      type: ASSIGNMENT_NOTIFICATION,
      recipientUid,
      seen: { $ne: true },
    },
    { $set: { seen: true } },
  );
  return { ok: true };
}
