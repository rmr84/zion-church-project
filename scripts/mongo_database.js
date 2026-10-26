import { REQUESTS, closeDb, getDb, seedDatabase } from '../lib/db.js';
import { SEED_REQUESTS } from '../lib/seed-data.js';
import { SEED_REVIEWS, reviewsCollection, seedReviews } from '../lib/reviews.js';

const reviews = await reviewsCollection();
const existingReviews = await reviews.countDocuments();
let reviewCount = 0;
if (existingReviews === 0) {
  reviewCount = await seedReviews();
  console.log(`Seeded ${reviewCount} reviews`);
} else {
  reviewCount = existingReviews;
  console.log(`Reviews already present (${existingReviews}); left unchanged`);
}
for (const row of SEED_REVIEWS) {
  console.log(`${row.name}  ${row.detail}`);
}

try {
  const db = await getDb();
  await db.collection(REQUESTS).deleteMany({});
  await seedDatabase(db);
  const count = await db.collection(REQUESTS).countDocuments();
  console.log(`Seeded ${count} care requests in ${db.databaseName}`);
  for (const row of SEED_REQUESTS) {
    console.log(`${row.referenceCode}  ${row.urgency}  ${row.status}`);
  }
} catch (error) {
  console.error(`Care request seed skipped: ${error?.message || error}`);
}

await closeDb();
