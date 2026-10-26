import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findMember, memberLabel, memberValue } from '../lib/members.js';

test('memberValue uses email when the desk user has no name', () => {
  const member = { name: '', email: 'ryanruffing00@comcast.net', label: 'ryanruffing00@comcast.net' };
  assert.equal(memberValue(member), 'ryanruffing00@comcast.net');
  assert.equal(memberLabel(member), 'ryanruffing00@comcast.net');
});

test('findMember does not treat an empty assignee as a match', () => {
  const members = [
    { name: '', email: 'ryanruffing00@comcast.net', label: 'ryanruffing00@comcast.net' },
    { name: 'Jordan Lee', email: 'jordan@example.com', label: 'Jordan Lee' },
  ];
  assert.equal(findMember(members, ''), null);
  assert.equal(findMember(members, null), null);
  assert.equal(findMember(members, 'Jordan Lee')?.email, 'jordan@example.com');
  assert.equal(findMember(members, 'ryanruffing00@comcast.net')?.email, 'ryanruffing00@comcast.net');
});
