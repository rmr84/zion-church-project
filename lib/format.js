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
