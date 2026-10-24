import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SEED_REQUESTS } from '../lib/seed-data.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the README documents the demo password and every seeded code', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(example, /STAFF_PASSWORD=zion-care-team/);
  assert.ok(readme.includes('zion-care-team'));
  for (const row of SEED_REQUESTS) {
    assert.ok(readme.includes(row.referenceCode), row.referenceCode);
  }
});
