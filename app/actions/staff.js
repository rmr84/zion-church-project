'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateCareRequest } from '@/lib/requests';
import { isStaffSignedIn, signOutStaff } from '@/lib/session';
import { validateStaffUpdate } from '@/lib/validate';

export async function logout() {
  await signOutStaff();
  redirect('/');
}

export async function updateRequest(_previous, formData) {
  if (!(await isStaffSignedIn())) redirect('/sign-in');

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
