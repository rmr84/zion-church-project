'use server';

import { redirect } from 'next/navigation';
import { createRequest } from '@/lib/requests';
import { getRequester, isStaffSignedIn } from '@/lib/session';
import { validateSubmission } from '@/lib/validate';

export async function submitCareRequest(_previous, formData) {
  if (await isStaffSignedIn()) redirect('/staff');
  const result = validateSubmission({
    name: formData.get('name'),
    careType: formData.get('careType'),
    description: formData.get('description'),
    contactMethod: formData.get('contactMethod'),
    contactDetail: formData.get('contactDetail'),
    urgency: formData.get('urgency'),
  });

  if (!result.ok) return { errors: result.errors, values: result.values };

  const requester = await getRequester();
  let code;
  try {
    code = await createRequest(result.values, { account: requester });
  } catch (error) {
    console.error('Could not save the care request.', error?.code || error?.message || '');
    return {
      errors: { form: 'That request could not be saved. Try again in a moment.' },
      values: result.values,
    };
  }
  redirect(`/request/sent?code=${encodeURIComponent(code)}`);
}
