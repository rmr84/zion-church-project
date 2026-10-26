import { CARE_TYPES, STATUSES, labelFor } from './constants.js';
import { mongoClient } from './db.js';

export const NOTIFICATIONS = 'notifications';
const LIVE_DB = 'production';

function notificationsDatabaseName() {
  return process.env.MONGODB_DB || LIVE_DB;
}

export async function notificationsCollection() {
  const client = await mongoClient();
  const collection = client.db(notificationsDatabaseName()).collection(NOTIFICATIONS);
  await collection.createIndex({ createdAt: -1 });
  return collection;
}

export function buildConfirmation({ referenceCode, careType }) {
  const care = labelFor(CARE_TYPES, careType);
  return [
    `To: the person who submitted the request (address omitted from this log)`,
    `Subject: We received your Zion Church care request ${referenceCode}`,
    '',
    `We received your ${care} request.`,
    `Your reference code is ${referenceCode}.`,
    'Use that code on the Zion Church care desk to check for updates.',
    '',
    'This message does not include the description or any care team notes.',
  ].join('\n');
}

export function buildStatusNotice({ referenceCode, careType, status, memberNote }) {
  const care = labelFor(CARE_TYPES, careType);
  const state = labelFor(STATUSES, status);
  const lines = [
    `To: the person who submitted the request (address omitted from this log)`,
    `Subject: Update on Zion Church care request ${referenceCode}`,
    '',
    `Your ${care} request ${referenceCode} is now ${state}.`,
  ];
  const note = String(memberNote || '').trim();
  if (note) lines.push('', 'Note from the care team:', note);
  lines.push('', 'Private care team notes are not included in this message.');
  return lines.join('\n');
}

export function buildInviteNotice({ email, roleLabel, loginUrl }) {
  return [
    `To: ${email}`,
    'Subject: You are invited to the Zion Church care desk',
    '',
    `You have been invited to the Zion Church care desk as ${roleLabel}.`,
    'Check your inbox for a Firebase email with a link to set your password.',
    `After that, sign in at ${loginUrl}.`,
  ].join('\n');
}

function formatEntry(createdAt, body) {
  return `[${createdAt}] EMAIL (not sent)\n${body}`;
}

export const SEED_NOTIFICATIONS = [
  {
    createdAt: '2026-10-23T12:10:05.000Z',
    kind: 'confirmation',
    body: buildConfirmation({ referenceCode: 'ZC-HOSP-1001', careType: 'hospital_visit' }),
  },
  {
    createdAt: '2026-10-22T19:40:05.000Z',
    kind: 'status',
    body: buildStatusNotice({
      referenceCode: 'ZC-OTHR-1005',
      careType: 'other',
      status: 'in_review',
      memberNote: 'A driver is confirmed for Friday morning.',
    }),
  },
  {
    createdAt: '2026-10-21T16:05:00.000Z',
    kind: 'status',
    body: buildStatusNotice({
      referenceCode: 'ZC-MEAL-1002',
      careType: 'meal_delivery',
      status: 'received',
      memberNote: '',
    }),
  },
  {
    createdAt: '2026-10-20T14:22:00.000Z',
    kind: 'invite',
    body: buildInviteNotice({
      email: 'care.team@example.com',
      roleLabel: 'Care Team',
      loginUrl: 'https://zion-church-project.vercel.app/staff/login',
    }),
  },
  {
    createdAt: '2026-10-19T11:30:00.000Z',
    kind: 'confirmation',
    body: buildConfirmation({ referenceCode: 'ZC-PRAY-1003', careType: 'prayer_support' }),
  },
];

export async function logNotice(body) {
  const createdAt = new Date().toISOString();
  const text = String(body || '');
  const entry = formatEntry(createdAt, text);
  console.log(`${entry}\n---\n`);
  try {
    const collection = await notificationsCollection();
    await collection.insertOne({
      createdAt,
      kind: 'email',
      body: text,
      entry,
    });
  } catch (error) {
    console.error('Could not write the email log.', error?.code || error?.message || '');
  }
}

export async function listEmailLogEntries() {
  try {
    const collection = await notificationsCollection();
    const rows = await collection.find(
      {},
      { projection: { _id: 0, entry: 1, body: 1, createdAt: 1 } },
    ).sort({ createdAt: -1 }).toArray();
    return rows.map((row) => (
      row.entry || formatEntry(row.createdAt || new Date().toISOString(), row.body || '')
    ));
  } catch (error) {
    console.error('Could not read the email log.', error?.code || error?.message || '');
    return [];
  }
}

export async function seedNotifications(db) {
  const collection = db
    ? db.collection(NOTIFICATIONS)
    : await notificationsCollection();
  const rows = SEED_NOTIFICATIONS.map((item) => ({
    createdAt: item.createdAt,
    kind: item.kind,
    body: item.body,
    entry: formatEntry(item.createdAt, item.body),
  }));
  if (rows.length === 0) return 0;
  await collection.insertMany(rows);
  return rows.length;
}

export async function seedNotificationsIfEmpty() {
  const collection = await notificationsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return 0;
  return seedNotifications();
}
