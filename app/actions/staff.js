'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { passwordMatches } from '@/lib/password';
import { updateCareRequest } from '@/lib/requests';
import { isStaffSignedIn, signInStaff, signOutStaff } from '@/lib/session';
import { validateStaffUpdate } from '@/lib/validate';

export async function login(formData) {
  const sessionSecret = process.env.STAFF_SESSION_SECRET || '';
  if (!process.env.STAFF_PASSWORD || sessionSecret.length < 16) {
    redirect('/staff/login?error=config');
  }

  const password = String(formData.get('password') || '');
  if (!passwordMatches(password)) redirect('/staff/login?error=1');

  await signInStaff();
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
