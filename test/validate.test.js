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

test('phone, email, and text require a valid way to reach the person', () => {
  for (const contactMethod of ['phone', 'text']) {
    const empty = validateSubmission({ ...valid, contactMethod, contactDetail: '  ' });
    assert.equal(empty.ok, false);
    assert.equal(empty.errors.contactDetail, 'Enter a 10-digit phone number.');
    const bad = validateSubmission({ ...valid, contactMethod, contactDetail: 'asdf' });
    assert.equal(bad.ok, false);
    assert.equal(bad.errors.contactDetail, 'Enter a 10-digit phone number.');
    const short = validateSubmission({ ...valid, contactMethod, contactDetail: '555-0148' });
    assert.equal(short.ok, false);
    assert.equal(short.errors.contactDetail, 'Enter a 10-digit phone number.');
    const ok = validateSubmission({ ...valid, contactMethod, contactDetail: '(555) 010-0148' });
    assert.equal(ok.ok, true);
  }

  const emptyEmail = validateSubmission({ ...valid, contactMethod: 'email', contactDetail: '  ' });
  assert.equal(emptyEmail.ok, false);
  assert.equal(emptyEmail.errors.contactDetail, 'Enter an email address.');
  const badEmail = validateSubmission({ ...valid, contactMethod: 'email', contactDetail: 'not-an-email' });
  assert.equal(badEmail.ok, false);
  assert.equal(badEmail.errors.contactDetail, 'Enter a valid email address.');
  const okEmail = validateSubmission({ ...valid, contactMethod: 'email', contactDetail: 'care@example.com' });
  assert.equal(okEmail.ok, true);
});

test('in person and no contact needed do not keep a contact detail', () => {
  for (const contactMethod of ['in_person', 'none']) {
    const result = validateSubmission({ ...valid, contactMethod, contactDetail: '555-0148' });
    assert.equal(result.ok, true);
    assert.equal(result.values.contactDetail, '');
  }
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

test('completed staff updates require an assignee', () => {
  const missing = validateStaffUpdate({
    referenceCode: 'ZC-MEAL-1002',
    status: 'completed',
    assignee: '',
    memberNote: '',
    internalNote: '',
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.errors.assignee, 'Assign a care team member before marking this completed.');

  const assigned = validateStaffUpdate({
    referenceCode: 'ZC-MEAL-1002',
    status: 'completed',
    assignee: 'Pastor Ellis',
    memberNote: '',
    internalNote: '',
  });
  assert.equal(assigned.ok, true);
});
