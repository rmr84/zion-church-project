import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordProblem } from '../lib/password-rules.js';

test('a password needs 8 characters, a capital letter, and a number or special character', () => {
  assert.equal(passwordProblem(''), 'Password needs at least 8 characters, one capital letter, and one number or special character.');
  assert.equal(passwordProblem('abcdefg1'), 'Password needs one capital letter.');
  assert.equal(passwordProblem('Abcdefgh'), 'Password needs one number or special character.');
  assert.equal(passwordProblem('Abcdef1'), 'Password needs at least 8 characters.');
  assert.equal(passwordProblem('Abcdefg1'), '');
  assert.equal(passwordProblem('Abcdefg!'), '');
});
