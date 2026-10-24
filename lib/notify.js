import fs from 'node:fs';
import path from 'node:path';
import { CARE_TYPES, STATUSES, labelFor } from './constants.js';

export function defaultLogPath() {
  return process.env.CARE_LOG_PATH || path.join(process.cwd(), 'logs', 'notifications.log');
}

export function buildConfirmation({ referenceCode, careType }) {
  const care = labelFor(CARE_TYPES, careType);
  return [
    `To: the person who submitted the request (address omitted from this log)`,
    `Subject: We received your Zion Church care request ${referenceCode}`,
    '',
    `We received your ${care} request.`,
    `Your reference code is ${referenceCode}.`,
    'Use that code on the Zion Church care desk to check for updates.',
    '',
    'This message does not include the description or any care team notes.',
  ].join('\n');
}

export function buildStatusNotice({ referenceCode, careType, status, memberNote }) {
  const care = labelFor(CARE_TYPES, careType);
  const state = labelFor(STATUSES, status);
  const lines = [
    `To: the person who submitted the request (address omitted from this log)`,
    `Subject: Update on Zion Church care request ${referenceCode}`,
    '',
    `Your ${care} request ${referenceCode} is now ${state}.`,
  ];
  const note = String(memberNote || '').trim();
  if (note) lines.push('', 'Note from the care team:', note);
  lines.push('', 'Private care team notes are not included in this message.');
  return lines.join('\n');
}

export function logNotice(body, filePath = defaultLogPath()) {
  const entry = `[${new Date().toISOString()}] NOTIFICATION (not sent)\n${body}\n---\n`;
  console.log(entry);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, entry, 'utf8');
}
