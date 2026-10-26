import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SEED_REQUESTS } from '../lib/seed-data.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the README documents sign-in and every seeded code', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.equal(example.includes('STAFF_PASSWORD'), false);
  assert.equal(readme.includes('zion-care-team'), false);
  assert.match(example, /STAFF_SESSION_SECRET=/);
  for (const row of SEED_REQUESTS) {
    assert.ok(readme.includes(row.referenceCode), row.referenceCode);
  }
});
