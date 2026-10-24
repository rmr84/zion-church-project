import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildStatusNotice, logNotice } from '../lib/notify.js';

test('status mail omits staff-only fields even if they are passed in', () => {
  const text = buildStatusNotice({
    referenceCode: 'ZC-TEST-0001',
    careType: 'meal_delivery',
    status: 'assigned',
    memberNote: 'We will call today.',
    internalNote: 'PORCH-CODE-441',
    description: 'Room 312 diagnosis',
  });

  assert.match(text, /Assigned/);
  assert.match(text, /We will call today/);
  assert.equal(text.includes('PORCH-CODE-441'), false);
  assert.equal(text.includes('Room 312'), false);
  assert.match(text, /not sent|address omitted|Private care team notes/);
});

test('the notification stub is written to a log file', () => {
  const file = path.join(os.tmpdir(), `zion-log-${process.pid}-${Date.now()}.log`);
  logNotice('Hello from the desk', file);
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /NOTIFICATION \(not sent\)/);
  assert.match(text, /Hello from the desk/);
});
