'use server';

import { redirect } from 'next/navigation';
import { createRequest } from '@/lib/requests';
import { getRequester } from '@/lib/session';
import { validateSubmission } from '@/lib/validate';

export async function submitCareRequest(_previous, formData) {
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
  const code = await createRequest(result.values, { account: requester });
  redirect(`/request/sent?code=${encodeURIComponent(code)}`);
}
