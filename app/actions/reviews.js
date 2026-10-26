'use server';

import { revalidatePath } from 'next/cache';
import {
  REVIEW_STATUS_APPROVED,
  markAllReviewNotificationsSeen,
  markReviewNotificationSeen,
  setReviewStatus,
} from '@/lib/reviews';
import { isStaffSignedIn } from '@/lib/session';

function revalidateReviewPaths() {
  revalidatePath('/');
  revalidatePath('/staff/reviews');
  revalidatePath('/staff/notifications');
}

export async function approveReview(id) {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: 'Sign in again to update this review.' };
  }
  const result = await setReviewStatus(id, REVIEW_STATUS_APPROVED);
  if (!result.ok) return result;
  revalidateReviewPaths();
  return { ok: true };
}

export async function markReviewSeen(id) {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: 'Sign in again to update notifications.' };
  }
  const result = await markReviewNotificationSeen(id);
  if (!result.ok) return result;
  revalidatePath('/staff/notifications');
  return { ok: true };
}

export async function markAllReviewsSeen() {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: 'Sign in again to update notifications.' };
  }
  await markAllReviewNotificationsSeen();
  revalidatePath('/staff/notifications');
  return { ok: true };
}
