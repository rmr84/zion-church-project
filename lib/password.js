import { secretsMatch } from './session-token.js';

export function passwordMatches(input) {
  const expected = process.env.STAFF_PASSWORD || '';
  if (!expected) return false;
  return secretsMatch(String(input ?? ''), expected);
}
