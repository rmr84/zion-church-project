const DAY = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York',
};

const WHEN = {
  ...DAY,
  hour: 'numeric',
  minute: '2-digit',
};

function format(iso, options) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatDay(iso) {
  return format(iso, DAY);
}

export function formatWhen(iso) {
  const formatted = format(iso, WHEN);
  return formatted ? `${formatted} ET` : '';
}

/** Calendar day (YYYY-MM-DD) in America/New_York — matches the desk Date column. */
export function dayKey(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Format an `<input type="date">` value (YYYY-MM-DD) for pills / labels. */
export function formatDateInput(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
