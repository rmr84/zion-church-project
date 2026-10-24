export const CARE_TYPES = [
  { value: 'hospital_visit', label: 'Hospital Visit' },
  { value: 'meal_delivery', label: 'Meal Delivery' },
  { value: 'counseling_referral', label: 'Counseling Referral' },
  { value: 'prayer_support', label: 'Prayer Support' },
  { value: 'other', label: 'Other' },
];

export const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text message' },
  { value: 'in_person', label: 'In person' },
  { value: 'none', label: 'No contact needed' },
];

export const URGENCY_LEVELS = [
  { value: 'routine', label: 'Routine', hint: 'When the team can get to it' },
  { value: 'soon', label: 'Soon', hint: 'Within the next few days' },
  { value: 'urgent', label: 'Urgent', hint: 'Today. If this is an emergency, call 911.' },
];


export const STATUSES = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
];

export function labelFor(options, value) {
  const match = options.find((option) => option.value === value);
  return match ? match.label : value;
}

export function parseSort(value) {
  if (value === 'newest' || value === 'oldest' || value === 'urgency') return value;
  return 'urgency';
}
