import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEMO_CODES = [
  'ZC-KYSF-3ERD',
  'ZC-Q2YQ-YL57',
  'ZC-P8V9-6VD3',
  'ZC-XF96-R9SM',
];

test('the README documents sign-in and every live demo code', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.equal(example.includes('STAFF_PASSWORD'), false);
  assert.equal(readme.includes('zion-care-team'), false);
  assert.match(example, /STAFF_SESSION_SECRET=/);
  for (const code of DEMO_CODES) {
    assert.ok(readme.includes(code), code);
  }
});
