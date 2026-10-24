import { MongoClient } from 'mongodb';
import { SEED_REQUESTS } from './seed-data.js';

export const DATABASE_NAME = 'zion-care';
export const REQUESTS = 'care_requests';
export const MEMBER_VIEW = 'member_request_status';

const MEMBER_PROJECT = {
  _id: 0,
  referenceCode: 1,
  careType: 1,
  status: 1,
  memberNote: 1,
  updatedAt: 1,
};

const VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'referenceCode',
      'careType',
      'description',
      'contactMethod',
      'urgency',
      'status',
      'memberNote',
      'internalNote',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      referenceCode: { bsonType: 'string' },
      name: { bsonType: ['string', 'null'] },
      careType: { bsonType: 'string' },
      description: { bsonType: 'string' },
      contactMethod: { bsonType: 'string' },
      contactDetail: { bsonType: ['string', 'null'] },
      urgency: { enum: ['routine', 'soon', 'urgent'] },
      status: { enum: ['received', 'in_review', 'assigned', 'completed'] },
      assignee: { bsonType: ['string', 'null'] },
      memberNote: { bsonType: 'string' },
      internalNote: { bsonType: 'string' },
      createdAt: { bsonType: 'string' },
      updatedAt: { bsonType: 'string' },
      completedAt: { bsonType: ['string', 'null'] },
      requesterUid: { bsonType: ['string', 'null'] },
      requesterEmail: { bsonType: ['string', 'null'] },
    },
  },
};

function blankToNull(value) {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

export function databaseName() {
  return process.env.MONGODB_DB || DATABASE_NAME;
}

export async function migrate(db) {
  const existing = await db.listCollections({ name: REQUESTS }).toArray();
  if (existing.length === 0) {
    await db.createCollection(REQUESTS, {
      validator: VALIDATOR,
      validationAction: 'error',
    });
  } else if (existing[0].type !== 'view') {
    await db.command({
      collMod: REQUESTS,
      validator: VALIDATOR,
      validationAction: 'error',
    });
  }

  const requests = db.collection(REQUESTS);
  await requests.createIndex({ referenceCode: 1 }, { unique: true });
  await requests.createIndex({ requesterUid: 1, createdAt: -1 });

  const view = await db.listCollections({ name: MEMBER_VIEW }).toArray();
  if (view.length > 0) await db.collection(MEMBER_VIEW).drop();
  await db.createCollection(MEMBER_VIEW, {
    viewOn: REQUESTS,
    pipeline: [{ $project: MEMBER_PROJECT }],
  });
}

export async function insertCareRequest(db, row) {
  await db.collection(REQUESTS).insertOne({
    referenceCode: row.referenceCode,
    name: blankToNull(row.name),
    careType: row.careType,
    description: row.description,
    contactMethod: row.contactMethod,
    contactDetail: blankToNull(row.contactDetail),
    urgency: row.urgency,
    status: row.status || 'received',
    assignee: blankToNull(row.assignee),
    memberNote: row.memberNote || '',
    internalNote: row.internalNote || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
    completedAt: row.completedAt || null,
    requesterUid: blankToNull(row.requesterUid),
    requesterEmail: blankToNull(row.requesterEmail),
  });
}

export async function seedDatabase(db) {
  for (const row of SEED_REQUESTS) await insertCareRequest(db, row);
}

async function seedIfEmpty(db) {
  const count = await db.collection(REQUESTS).countDocuments();
  if (count === 0) await seedDatabase(db);
}

export async function closeDb() {
  if (globalThis.__zionCareClient) {
    await globalThis.__zionCareClient.close();
    globalThis.__zionCareClient = null;
    globalThis.__zionCareDb = null;
  }
}

export async function mongoClient() {
  if (globalThis.__zionCareClient) return globalThis.__zionCareClient;
  const uri = process.env.MONGODB_URI || '';
  if (!uri.startsWith('mongodb')) throw new Error('Set MONGODB_URI to the Atlas connection string.');

  const client = new MongoClient(uri);
  await client.connect();
  globalThis.__zionCareClient = client;
  return client;
}

export async function getDb() {
  if (globalThis.__zionCareDb) return globalThis.__zionCareDb;
  const client = await mongoClient();
  const db = client.db(databaseName());
  await migrate(db);
  await seedIfEmpty(db);
  globalThis.__zionCareDb = db;
  return db;
}
