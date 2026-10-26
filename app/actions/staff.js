'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { lookupFirebaseUser } from '@/lib/firebase-identity';
import { STATUSES } from '@/lib/constants';
import { createAssignmentNotification } from '@/lib/desk-notifications';
import { getStaffRequest, searchRequests, updateCareRequest } from '@/lib/requests';
import { getStaff, isStaffSignedIn, signInStaff, signOutRequester, signOutStaff } from '@/lib/session';
import { findMember, memberValue } from '@/lib/members';
import { ADMIN_ROLE, acceptDeskInvite, getUser, getUserRole, isDeskRole, listDeskMembers, saveUser } from '@/lib/users';
import { validateStaffUpdate } from '@/lib/validate';

async function canReopenCompleted() {
  const staff = await getStaff();
  if (!staff) return false;
  return (await getUserRole(staff.uid)) === ADMIN_ROLE;
}

async function reopenDenied(currentStatus, nextStatus) {
  if (currentStatus !== 'completed' || nextStatus === 'completed') return null;
  if (await canReopenCompleted()) return null;
  return 'Only an admin can move a completed request out of the archive.';
}

async function resolveAssignableAssignee(assignee) {
  const name = String(assignee || '').trim().slice(0, 120);
  if (!name) return { ok: true, value: '' };
  const members = await listDeskMembers();
  const member = findMember(members, name);
  if (!member || member.status === 'pending') {
    return { ok: false, formError: 'Choose an active care team member.' };
  }
  return { ok: true, value: memberValue(member) };
}

async function notifyNewAssignee(current, nextAssignee) {
  const staff = await getStaff();
  let assignedByLabel = '';
  if (staff?.uid) {
    try {
      const profile = await getUser(staff.uid);
      assignedByLabel = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
        || staff.email
        || '';
    } catch {
      assignedByLabel = staff.email || '';
    }
  }
  try {
    await createAssignmentNotification({
      assignee: nextAssignee,
      previousAssignee: current.assignee || '',
      referenceCode: current.referenceCode,
      careType: current.careType,
      assignedByUid: staff?.uid || '',
      assignedByLabel,
    });
  } catch (error) {
    console.error('Could not create the assignment notification.', error?.code || '');
  }
}

export async function establishStaffSession(idToken) {
  const identity = await lookupFirebaseUser(idToken);
  if (!identity) return { ok: false };
  try {
    await saveUser(identity);
  } catch (error) {
    console.error('Could not save the care team member.', error?.code || '');
    return { ok: false, reason: 'storage' };
  }
  if (!isDeskRole(await getUserRole(identity.uid))) {
    return { ok: false, reason: 'not-staff' };
  }
  try {
    await acceptDeskInvite(identity);
  } catch (error) {
    console.error('Could not mark the desk invite accepted.', error?.code || '');
  }
  await signOutRequester();
  await signInStaff(identity);
  redirect('/staff');
}

export async function searchCareRequests(query) {
  if (!(await isStaffSignedIn())) return [];
  try {
    return await searchRequests(query);
  } catch (error) {
    console.error('Could not search care requests.', error?.code || '');
    return [];
  }
}

export async function logout() {
  await signOutStaff();
  redirect('/');
}

export async function updateRequestAssignee(referenceCode, assignee, options = {}) {
  if (!(await isStaffSignedIn())) return { ok: false, formError: 'Sign in again to update this request.' };
  const assigned = await resolveAssignableAssignee(assignee);
  if (!assigned.ok) return assigned;

  const current = await getStaffRequest(referenceCode);
  if (!current) return { ok: false, formError: 'That request is not on file.' };

  const nextStatus = current.status === 'assigned' ? 'in_review' : current.status;

  const internalNote = Object.prototype.hasOwnProperty.call(options, 'internalNote')
    ? String(options.internalNote || '').trim().slice(0, 2000)
    : (current.internalNote || '');

  try {
    const updated = await updateCareRequest(current.referenceCode, {
      status: nextStatus,
      assignee: assigned.value,
      memberNote: current.memberNote || '',
      internalNote,
    });
    if (!updated) return { ok: false, formError: 'That request is not on file.' };
  } catch (error) {
    console.error('Could not assign the request.', error?.code || '');
    return { ok: false, formError: 'That assignment could not be saved. Try again.' };
  }

  await notifyNewAssignee(current, assigned.value);

  revalidatePath('/staff');
  revalidatePath('/staff/archive');
  revalidatePath(`/staff/requests/${current.referenceCode}`);
  revalidatePath('/staff/email-logs');
  revalidatePath('/staff/notifications');
  return { ok: true };
}

export async function updateRequestStatus(referenceCode, status) {
  if (!(await isStaffSignedIn())) return { ok: false, formError: 'Sign in again to update this request.' };
  if (!STATUSES.some((item) => item.value === status)) {
    return { ok: false, formError: 'Choose a status.' };
  }

  const current = await getStaffRequest(referenceCode);
  if (!current) return { ok: false, formError: 'That request is not on file.' };

  const denied = await reopenDenied(current.status, status);
  if (denied) return { ok: false, formError: denied };

  if (status === 'completed' && !String(current.assignee || '').trim()) {
    return { ok: false, formError: 'Assign a care team member before marking this completed.' };
  }

  try {
    const updated = await updateCareRequest(current.referenceCode, {
      status,
      assignee: current.assignee || '',
      memberNote: current.memberNote || '',
      internalNote: current.internalNote || '',
    });
    if (!updated) return { ok: false, formError: 'That request is not on file.' };
  } catch (error) {
    console.error('Could not update the request status.', error?.code || '');
    return { ok: false, formError: 'That status could not be saved. Try again.' };
  }

  revalidatePath('/staff');
  revalidatePath('/staff/archive');
  revalidatePath(`/staff/requests/${current.referenceCode}`);
  revalidatePath('/staff/email-logs');
  return { ok: true, status };
}

export async function updateRequest(_previous, formData) {
  if (!(await isStaffSignedIn())) redirect('/staff/login');

  const result = validateStaffUpdate({
    referenceCode: formData.get('referenceCode'),
    status: formData.get('status'),
    assignee: formData.get('assignee'),
    memberNote: formData.get('memberNote'),
    internalNote: formData.get('internalNote'),
  });

  if (!result.ok) return { errors: result.errors, values: result.values, saved: false };

  const current = await getStaffRequest(result.values.referenceCode);
  if (!current) {
    return {
      errors: { form: 'That request is not on file.' },
      values: result.values,
      saved: false,
    };
  }

  const denied = await reopenDenied(current.status, result.values.status);
  if (denied) {
    return {
      errors: { status: denied },
      values: result.values,
      saved: false,
    };
  }

  const assigned = await resolveAssignableAssignee(result.values.assignee);
  if (!assigned.ok) {
    return {
      errors: { assignee: assigned.formError },
      values: result.values,
      saved: false,
    };
  }
  const nextValues = { ...result.values, assignee: assigned.value };
  if (nextValues.status === 'completed' && !String(nextValues.assignee || '').trim()) {
    return {
      errors: { assignee: 'Assign a care team member before marking this completed.' },
      values: nextValues,
      saved: false,
    };
  }

  const updated = await updateCareRequest(result.values.referenceCode, nextValues);
  if (!updated) {
    return {
      errors: { form: 'That request is not on file.' },
      values: nextValues,
      saved: false,
    };
  }

  if (String(nextValues.assignee || '').trim() !== String(current.assignee || '').trim()) {
    await notifyNewAssignee(current, nextValues.assignee);
  }

  revalidatePath('/staff');
  revalidatePath('/staff/archive');
  revalidatePath(`/staff/requests/${updated.referenceCode}`);
  revalidatePath('/staff/email-logs');
  revalidatePath('/staff/notifications');

  return { errors: {}, values: nextValues, saved: true };
}
