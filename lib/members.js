export const UNASSIGNED = '__unassigned__';

export function memberValue(member) {
  const name = String(member?.name || '').trim();
  if (name && name !== 'Name not given') return name;
  return String(member?.email || '').trim();
}

export function memberLabel(member) {
  const label = String(member?.label || '').trim();
  if (label) return label;
  return memberValue(member) || 'Care Team';
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

export function activeMembers(members = []) {
  return members.filter((member) => member?.status !== 'pending');
}
