export const UNASSIGNED = '__unassigned__';

export function memberValue(member) {
  return member.name !== 'Name not given' ? member.name : member.email;
}

export function memberLabel(member) {
  return member.label || (member.name !== 'Name not given' ? member.name : member.email);
}

export function findMember(members, assignee) {
  const value = String(assignee || '').trim();
  if (!value) return null;
  return members.find((member) => (
    memberValue(member) === value
    || member.name === value
    || member.email === value
    || member.label === value
  )) || null;
}
