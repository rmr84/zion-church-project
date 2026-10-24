import fs from 'node:fs';
import path from 'node:path';
import { closeDb, databaseFile, getDb } from '../lib/db.js';
import { SEED_REQUESTS } from '../lib/seed-data.js';

closeDb();
const file = databaseFile();
for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(`${file}${suffix}`, { force: true });
}

const db = getDb();
const count = db.prepare('SELECT COUNT(*) AS n FROM care_requests').get().n;
console.log(`Seeded ${count} care requests in ${file}`);
for (const row of SEED_REQUESTS) {
  console.log(`${row.referenceCode}  ${row.urgency}  ${row.status}`);
}
closeDb();
