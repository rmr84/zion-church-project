import { CARE_TYPES, CONTACT_METHODS, STATUSES, URGENCY_LEVELS } from './constants.js';
import { normalizeReferenceCode } from './reference.js';

function clean(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function optionalText(value, max, errors, key) {
  const text = clean(value);
  if (text.length > max) errors[key] = `Use ${max} characters or fewer.`;
  return text;
}

function oneOf(value, options, errors, key, message) {
  const text = clean(value);
  if (!options.some((option) => option.value === text)) errors[key] = message;
  return text;
}

export function validateSubmission(raw) {
  const errors = {};
  const values = {
    name: optionalText(raw.name, 120, errors, 'name'),
    careType: oneOf(raw.careType, CARE_TYPES, errors, 'careType', 'Choose a type of care.'),
    description: optionalText(raw.description, 2000, errors, 'description'),
    contactMethod: oneOf(
      raw.contactMethod,
      CONTACT_METHODS,
      errors,
      'contactMethod',
      'Choose how the team should reach you.',
    ),
    contactDetail: optionalText(raw.contactDetail, 200, errors, 'contactDetail'),
    urgency: oneOf(raw.urgency, URGENCY_LEVELS, errors, 'urgency', ''),
  };

  if (!values.description) errors.description = 'Enter a short description.';
  if (['phone', 'email', 'text'].includes(values.contactMethod) && !values.contactDetail) {
    errors.contactDetail = 'Enter how we should reach you.';
  }
  if (values.contactMethod === 'in_person' || values.contactMethod === 'none') {
    values.contactDetail = '';
  }

  return { ok: Object.keys(errors).length === 0, errors, values };
}

export function validateStaffUpdate(raw) {
  const errors = {};
  const values = {
    referenceCode: normalizeReferenceCode(raw.referenceCode),
    status: oneOf(raw.status, STATUSES, errors, 'status', 'Choose a status.'),
    assignee: optionalText(raw.assignee, 120, errors, 'assignee'),
    memberNote: optionalText(raw.memberNote, 2000, errors, 'memberNote'),
    internalNote: optionalText(raw.internalNote, 2000, errors, 'internalNote'),
  };

  if (!values.referenceCode) errors.form = 'That request is not on file.';

  return { ok: Object.keys(errors).length === 0, errors, values };
}
