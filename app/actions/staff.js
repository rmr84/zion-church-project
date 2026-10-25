'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { lookupFirebaseUser } from '@/lib/firebase-identity';
import { updateCareRequest } from '@/lib/requests';
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

export async function logout() {
  await signOutStaff();
  redirect('/');
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
