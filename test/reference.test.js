import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateReferenceCode, normalizeReferenceCode } from '../lib/reference.js';

test('reference codes are readable and unambiguous', () => {
  const seen = new Set();
  for (let index = 0; index < 200; index += 1) {
    const code = generateReferenceCode();
    assert.match(code, /^ZC-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
    seen.add(code);
  }
  assert.equal(seen.size, 200);
});

test('lookup codes are normalized', () => {
  assert.equal(normalizeReferenceCode('  zc-hosp-1001 '), 'ZC-HOSP-1001');
  assert.equal(normalizeReferenceCode('nope'), '');
  assert.equal(normalizeReferenceCode('ZC HOSP'), '');
});
