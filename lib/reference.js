import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferenceCode(bytes = randomBytes(8)) {
  let body = '';
  for (let index = 0; index < 8; index += 1) {
    body += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return `ZC-${body.slice(0, 4)}-${body.slice(4)}`;
}

export function normalizeReferenceCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(code)) return '';
  return code;
}

export function* referenceCodes() {
  while (true) yield generateReferenceCode();
}
