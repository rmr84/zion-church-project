'use server';

import { revalidatePath } from 'next/cache';
import { REVIEW_STATUS_APPROVED, setReviewStatus } from '@/lib/reviews';
import { isStaffSignedIn } from '@/lib/session';

export async function approveReview(id) {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: 'Sign in again to update this review.' };
  }
  const result = await setReviewStatus(id, REVIEW_STATUS_APPROVED);
  if (!result.ok) return result;
  revalidatePath('/');
  revalidatePath('/staff/reviews');
  return { ok: true };
}
