'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { lookupFirebaseUser } from '@/lib/firebase-identity';
import { STATUSES } from '@/lib/constants';
import { getStaffRequest, searchRequests, updateCareRequest } from '@/lib/requests';
import { isStaffSignedIn, signInStaff, signOutRequester, signOutStaff } from '@/lib/session';
import { getUserRole, isDeskRole, saveUser } from '@/lib/users';
import { validateStaffUpdate } from '@/lib/validate';

export async function establishStaffSession(idToken) {
  const identity = await lookupFirebaseUser(idToken);
  if (!identity) return { ok: false };
  if (!identity.emailVerified) return { ok: false, reason: 'unverified' };
  if (!isDeskRole(await getUserRole(identity.uid))) return { ok: false, reason: 'not-staff' };
  try {
    await saveUser(identity);
  } catch (error) {
    console.error('Could not save the care team member.', error?.code || '');
    return { ok: false, reason: 'storage' };
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
  const name = String(assignee || '').trim().slice(0, 120);

  const current = await getStaffRequest(referenceCode);
  if (!current) return { ok: false, formError: 'That request is not on file.' };

  let nextStatus = current.status;
  if (name) {
    if (current.status === 'received') nextStatus = 'assigned';
  } else if (current.status === 'assigned') {
    nextStatus = 'received';
  }

  const internalNote = Object.prototype.hasOwnProperty.call(options, 'internalNote')
    ? String(options.internalNote || '').trim().slice(0, 2000)
    : (current.internalNote || '');

  try {
    const updated = await updateCareRequest(current.referenceCode, {
      status: nextStatus,
      assignee: name,
      memberNote: current.memberNote || '',
      internalNote,
    });
    if (!updated) return { ok: false, formError: 'That request is not on file.' };
  } catch (error) {
    console.error('Could not assign the request.', error?.code || '');
    return { ok: false, formError: 'That assignment could not be saved. Try again.' };
  }

  revalidatePath('/staff');
  revalidatePath('/staff/archive');
  revalidatePath(`/staff/requests/${current.referenceCode}`);
  return { ok: true };
}

export async function updateRequestStatus(referenceCode, status) {
  if (!(await isStaffSignedIn())) return { ok: false, formError: 'Sign in again to update this request.' };
  if (!STATUSES.some((item) => item.value === status)) {
    return { ok: false, formError: 'Choose a status.' };
  }

  const current = await getStaffRequest(referenceCode);
  if (!current) return { ok: false, formError: 'That request is not on file.' };

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

  const updated = await updateCareRequest(result.values.referenceCode, result.values);
  if (!updated) {
    return {
      errors: { form: 'That request is not on file.' },
      values: result.values,
      saved: false,
    };
  }

  revalidatePath('/staff');
  revalidatePath('/staff/archive');
  revalidatePath(`/staff/requests/${updated.referenceCode}`);

  return { errors: {}, values: result.values, saved: true };
}
