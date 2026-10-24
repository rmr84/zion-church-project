import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateStaffUpdate, validateSubmission } from '../lib/validate.js';

const valid = {
  name: '',
  careType: 'prayer_support',
  description: 'Please pray for my sister.',
  contactMethod: 'none',
  contactDetail: '',
  urgency: 'routine',
};

test('an anonymous request is valid', () => {
  const result = validateSubmission(valid);
  assert.equal(result.ok, true);
  assert.equal(result.values.name, '');
});

test('description, care type, contact method, and urgency are required', () => {
  const result = validateSubmission({ ...valid, description: '   ', careType: '', contactMethod: 'fax', urgency: 'now' });
  assert.equal(result.ok, false);
  assert.equal(result.errors.description, 'Enter a short description.');
  assert.equal(result.errors.careType, 'Choose a type of care.');
  assert.equal(result.errors.contactMethod, 'Choose how the team should reach you.');
  assert.equal(result.errors.urgency, 'Choose an urgency.');
});

test('staff updates only accept known statuses', () => {
  const result = validateStaffUpdate({
    referenceCode: 'zc-meal-1002',
    status: 'done',
    assignee: '',
    memberNote: '',
    internalNote: '',
  });
  assert.equal(result.ok, false);
  assert.equal(result.values.referenceCode, 'ZC-MEAL-1002');
  assert.equal(result.errors.status, 'Choose a status.');
});
