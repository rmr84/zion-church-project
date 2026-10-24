const PHOTO_TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/gif', 'gif'],
  ['image/svg+xml', 'svg'],
]);

export const PHOTO_LIMIT = 10 * 1024 * 1024;

export function profileNameProblem(value, label) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name) return '';
  if (name.length > 60) return `Use 60 characters or fewer for ${label}.`;
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) return `Use letters for ${label}.`;
  return '';
}

export function cleanProfileName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function cleanProfilePhone(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function profilePhoneProblem(value) {
  const phone = cleanProfilePhone(value);
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15 || !/^[+()\d][\d\s().+-]*$/.test(phone)) {
    return 'Enter a phone number.';
  }
  return '';
}

export function photoProblem(type, size) {
  if (!size) return '';
  if (size > PHOTO_LIMIT) return 'Use a picture that is 10MB or smaller.';
  if (!PHOTO_TYPES.has(type)) return 'Use a PNG, JPG, GIF, or SVG.';
  return '';
}

function startsWith(bytes, signature, offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function detectedPhotoType(bytes, declaredType) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let type = '';
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47])) type = 'image/png';
  else if (startsWith(data, [0xff, 0xd8, 0xff])) type = 'image/jpeg';
  else if (startsWith(data, [0x47, 0x49, 0x46, 0x38])) type = 'image/gif';
  else if (declaredType === 'image/svg+xml' && looksLikeSvg(data)) type = 'image/svg+xml';
  if (!type || type !== declaredType || !PHOTO_TYPES.has(type)) return '';
  return type;
}

function looksLikeSvg(bytes) {
  const sample = new TextDecoder().decode(bytes).slice(0, 200000).replace(/^\uFEFF/, '').trim();
  if (!/<svg[\s>]/i.test(sample.slice(0, 2000))) return false;
  return !/<script|<\/script|javascript:|on[a-z]+\s*=|<foreignObject/i.test(sample);
}

export function photoExtension(type) {
  return PHOTO_TYPES.get(type) || '';
}
