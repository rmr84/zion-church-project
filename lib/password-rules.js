export function passwordProblem(password) {
  const missing = [];
  if (password.length < 8) missing.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) missing.push('one capital letter');
  if (!/[^A-Za-z]/.test(password)) missing.push('one number or special character');
  if (missing.length === 0) return '';
  if (missing.length === 1) return `Password needs ${missing[0]}.`;
  if (missing.length === 2) return `Password needs ${missing[0]} and ${missing[1]}.`;
  return `Password needs ${missing[0]}, ${missing[1]}, and ${missing[2]}.`;
}
