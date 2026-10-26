import { mongoClient } from './db.js';

export const REVIEWS_COLLECTION = 'reviews';
const LIVE_REVIEWS_DB = 'production';

export const SEED_REVIEWS = [
  {
    quote: 'Someone from the team brought dinner the week I came home. I only had to ask once.',
    name: 'Naomi',
    detail: 'Meal delivery',
  },
  {
    quote: 'I left my name off the request. They still prayed, and the note I got back was kind.',
    name: 'Anonymous',
    detail: 'Prayer support',
  },
  {
    quote: 'They visited my father in the hospital and updated the status so I knew it had happened.',
    name: 'Helen',
    detail: 'Hospital visit',
  },
  {
    quote: 'They helped me find a counselor and checked in after the first appointment.',
    name: 'Grace',
    detail: 'Counseling referral',
  },
  {
    quote: 'I asked for a visit for my neighbor. The team was gentle and kept it quiet.',
    name: 'Thomas',
    detail: 'Care visit',
  },
  {
    quote: 'The reference code made it easy to see that someone had picked up the request.',
    name: 'Miriam',
    detail: 'Follow-up',
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
  return reviews;
}

function reviewView(row) {
  return {
    quote: row.quote || '',
    name: row.name || 'Anonymous',
    detail: row.detail || '',
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

export async function listReviews() {
  await seedReviewsIfEmpty();
  const collection = await reviewsCollection();
  const rows = await collection.find(
    {},
    { projection: { _id: 0, quote: 1, name: 1, detail: 1, createdAt: 1, sortOrder: 1 } },
  ).sort({ sortOrder: 1, createdAt: 1 }).toArray();
  return rows.map(reviewView);
}
