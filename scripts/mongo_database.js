import { REQUESTS, closeDb, getDb, seedDatabase } from '../lib/db.js';
import { SEED_REQUESTS } from '../lib/seed-data.js';

const db = await getDb();
await db.collection(REQUESTS).deleteMany({});
await seedDatabase(db);
const count = await db.collection(REQUESTS).countDocuments();
console.log(`Seeded ${count} care requests in ${db.databaseName}`);
for (const row of SEED_REQUESTS) {
  console.log(`${row.referenceCode}  ${row.urgency}  ${row.status}`);
}
await closeDb();
