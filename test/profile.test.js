import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectedPhotoType, photoProblem, profileNameProblem, profilePhoneProblem } from '../lib/profile.js';

test('profile names accept ordinary names and blank values', () => {
  assert.equal(profileNameProblem('Ryan', 'first name'), '');
  assert.equal(profileNameProblem("O'Neil", 'last name'), '');
  assert.equal(profileNameProblem('  ', 'first name'), '');
  assert.equal(profileNameProblem('', 'last name'), '');
  assert.match(profileNameProblem('Ryan2', 'first name'), /letters/);
});

test('profile phone numbers are optional and reject letters', () => {
  assert.equal(profilePhoneProblem(''), '');
  assert.equal(profilePhoneProblem('  '), '');
  assert.equal(profilePhoneProblem('(555) 010-0148'), '');
  assert.match(profilePhoneProblem('call me'), /phone number/);
});

test('photo checks honor the type and the 10MB limit', () => {
  assert.equal(photoProblem('image/png', 0), '');
  assert.equal(photoProblem('image/png', 1024), '');
  assert.equal(photoProblem('image/svg+xml', 20), '');
  assert.match(photoProblem('text/plain', 20), /PNG, JPG, GIF, or SVG/);
  assert.match(photoProblem('image/png', 10 * 1024 * 1024 + 1), /10MB/);
});

test('photo bytes have to match the declared type', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
  assert.equal(detectedPhotoType(png, 'image/png'), 'image/png');
  assert.equal(detectedPhotoType(png, 'image/jpeg'), '');
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  assert.equal(detectedPhotoType(svg, 'image/svg+xml'), 'image/svg+xml');
  const script = new TextEncoder().encode('<svg><script>alert(1)</script></svg>');
  assert.equal(detectedPhotoType(script, 'image/svg+xml'), '');
});
