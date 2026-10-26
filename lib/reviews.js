import { ObjectId } from 'mongodb';
import { CARE_TYPES, labelFor } from './constants.js';
import { mongoClient } from './db.js';
import { normalizeReferenceCode } from './reference.js';
import { getMemberRequest } from './requests.js';

export const REVIEWS_COLLECTION = 'reviews';
export const REVIEW_STATUS_APPROVED = 'approved';
export const REVIEW_STATUS_PENDING = 'pending';
export const REVIEW_STATUS_REJECTED = 'rejected';
const LIVE_REVIEWS_DB = 'production';
const REVIEW_STATUSES = [REVIEW_STATUS_APPROVED, REVIEW_STATUS_PENDING, REVIEW_STATUS_REJECTED];
const QUOTE_MAX = 1000;
const NAME_MAX = 80;

export const SEED_REVIEWS = [
  {
    quote: 'Someone from the team brought dinner the week I came home. I only had to ask once.',
    name: 'Naomi',
    detail: 'Meal delivery',
    status: REVIEW_STATUS_APPROVED,
  },
  {
    quote: 'I left my name off the request. They still prayed, and the note I got back was kind.',
    name: 'Anonymous',
    detail: 'Prayer support',
    status: REVIEW_STATUS_APPROVED,
  },
  {
    quote: 'They visited my father in the hospital and updated the status so I knew it had happened.',
    name: 'Helen',
    detail: 'Hospital visit',
    status: REVIEW_STATUS_APPROVED,
  },
  {
    quote: 'They helped me find a counselor and checked in after the first appointment.',
    name: 'Grace',
    detail: 'Counseling referral',
    status: REVIEW_STATUS_APPROVED,
  },
  {
    quote: 'I asked for a visit for my neighbor. The team was gentle and kept it quiet.',
    name: 'Thomas',
    detail: 'Care visit',
    status: REVIEW_STATUS_APPROVED,
  },
  {
    quote: 'The reference code made it easy to see that someone had picked up the request.',
    name: 'Miriam',
    detail: 'Follow-up',
    status: REVIEW_STATUS_APPROVED,
  },
];

export const REVIEWS = SEED_REVIEWS;

function reviewsDatabaseName() {
  return process.env.MONGODB_DB || LIVE_REVIEWS_DB;
}

export async function reviewsCollection() {
  const client = await mongoClient();
  const reviews = client.db(reviewsDatabaseName()).collection(REVIEWS_COLLECTION);
  await reviews.createIndex({ createdAt: -1 });
  await reviews.createIndex({ status: 1, sortOrder: 1 });
  await reviews.createIndex({ referenceCode: 1 }, { sparse: true });
  return reviews;
}

function reviewView(row) {
  return {
    id: row.id || (row._id ? String(row._id) : ''),
    quote: row.quote || '',
    name: row.name || 'Anonymous',
    detail: row.detail || '',
    status: row.status || REVIEW_STATUS_APPROVED,
    referenceCode: row.referenceCode || '',
    seen: row.seen === true,
    createdAt: row.createdAt || '',
  };
}

export async function seedReviews(db) {
  const collection = db
    ? db.collection(REVIEWS_COLLECTION)
    : await reviewsCollection();
  const now = new Date().toISOString();
  const rows = SEED_REVIEWS.map((review, index) => ({
    quote: review.quote,
    name: review.name,
    detail: review.detail,
    status: review.status || REVIEW_STATUS_APPROVED,
    createdAt: now,
    sortOrder: index,
  }));
  if (rows.length === 0) return 0;
  await collection.insertMany(rows);
  return rows.length;
}

export async function seedReviewsIfEmpty() {
  const collection = await reviewsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return 0;
  return seedReviews();
}

export async function ensureSeedReviewsApproved() {
  const collection = await reviewsCollection();
  const result = await collection.updateMany(
    {
      status: { $exists: false },
      quote: { $in: SEED_REVIEWS.map((review) => review.quote) },
    },
    { $set: { status: REVIEW_STATUS_APPROVED } },
  );
  return result.modifiedCount;
}

const LIST_PROJECTION = {
  quote: 1,
  name: 1,
  detail: 1,
  status: 1,
  referenceCode: 1,
  seen: 1,
  createdAt: 1,
  sortOrder: 1,
};

export async function listReviews({ status = REVIEW_STATUS_APPROVED } = {}) {
  await seedReviewsIfEmpty();
  await ensureSeedReviewsApproved();
  const collection = await reviewsCollection();
  const filter = status ? { status } : {};
  const rows = await collection.find(filter, { projection: LIST_PROJECTION }).sort({
    status: 1,
    sortOrder: 1,
    createdAt: -1,
  }).toArray();
  return rows.map((row) => reviewView({ ...row, id: String(row._id) }));
}

export async function listDeskReviews() {
  await seedReviewsIfEmpty();
  await ensureSeedReviewsApproved();
  const collection = await reviewsCollection();
  const rows = await collection.find({}, { projection: LIST_PROJECTION }).sort({
    status: -1,
    createdAt: -1,
  }).toArray();
  return rows.map((row) => reviewView({ ...row, id: String(row._id) }));
}

export async function createPendingReview({ referenceCode, quote, name }) {
  const code = normalizeReferenceCode(referenceCode);
  const feedback = String(quote || '').trim().slice(0, QUOTE_MAX);
  const displayName = String(name || '').trim().slice(0, NAME_MAX);

  if (!code) return { ok: false, formError: 'Enter a valid reference code.' };
  if (feedback.length < 8) return { ok: false, formError: 'Share a bit more in your feedback.' };

  const request = await getMemberRequest(code);
  if (!request) return { ok: false, formError: 'No request matches that code.' };
  if (request.status !== 'completed') {
    return { ok: false, formError: 'Feedback is available after a request is completed.' };
  }

  const collection = await reviewsCollection();
  const existing = await collection.findOne({
    referenceCode: code,
    status: { $in: [REVIEW_STATUS_PENDING, REVIEW_STATUS_APPROVED] },
  });
  if (existing) {
    return { ok: false, formError: 'Feedback for this request is already on file.' };
  }

  const now = new Date().toISOString();
  const doc = {
    quote: feedback,
    name: displayName || request.name || 'Anonymous',
    detail: labelFor(CARE_TYPES, request.careType),
    status: REVIEW_STATUS_PENDING,
    referenceCode: code,
    seen: false,
    createdAt: now,
    sortOrder: Number.MAX_SAFE_INTEGER,
  };
  const result = await collection.insertOne(doc);
  return { ok: true, id: String(result.insertedId) };
}

function reviewObjectId(id) {
  try {
    return new ObjectId(String(id || ''));
  } catch {
    return null;
  }
}

export async function setReviewStatus(id, status) {
  if (!REVIEW_STATUSES.includes(status)) {
    return { ok: false, formError: 'Choose a review status.' };
  }
  const objectId = reviewObjectId(id);
  if (!objectId) return { ok: false, formError: 'That review is not on file.' };

  const collection = await reviewsCollection();
  const fields = { status };
  if (status === REVIEW_STATUS_APPROVED || status === REVIEW_STATUS_REJECTED) {
    fields.seen = true;
  }
  const result = await collection.updateOne(
    { _id: objectId },
    { $set: fields },
  );
  if (!result.matchedCount) return { ok: false, formError: 'That review is not on file.' };
  return { ok: true };
}

export async function countUnseenReviewNotifications() {
  const collection = await reviewsCollection();
  return collection.countDocuments({
    status: REVIEW_STATUS_PENDING,
    seen: { $ne: true },
  });
}

export async function listUnseenReviewNotifications() {
  const collection = await reviewsCollection();
  const rows = await collection.find(
    { status: REVIEW_STATUS_PENDING, seen: { $ne: true } },
    { projection: LIST_PROJECTION },
  ).sort({ createdAt: -1 }).toArray();
  return rows.map((row) => reviewView({ ...row, id: String(row._id) }));
}

export async function markReviewNotificationSeen(id) {
  const objectId = reviewObjectId(id);
  if (!objectId) return { ok: false, formError: 'That notification is not on file.' };
  const collection = await reviewsCollection();
  const result = await collection.updateOne(
    { _id: objectId, status: REVIEW_STATUS_PENDING },
    { $set: { seen: true } },
  );
  if (!result.matchedCount) return { ok: false, formError: 'That notification is not on file.' };
  return { ok: true };
}

export async function markAllReviewNotificationsSeen() {
  const collection = await reviewsCollection();
  await collection.updateMany(
    { status: REVIEW_STATUS_PENDING, seen: { $ne: true } },
    { $set: { seen: true } },
  );
  return { ok: true };
}
