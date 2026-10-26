'use server';

import { revalidatePath } from 'next/cache';
import {
  REVIEW_STATUS_APPROVED,
  REVIEW_STATUS_REJECTED,
  markAllReviewNotificationsSeen,
  markReviewNotificationSeen,
  setReviewStatus,
} from '@/lib/reviews';
import { getStaff, isStaffSignedIn } from '@/lib/session';
import { ADMIN_ROLE, getUserRole } from '@/lib/users';

function revalidateReviewPaths() {
  revalidatePath('/');
  revalidatePath('/staff/reviews');
  revalidatePath('/staff/notifications');
}

async function requireAdmin(action = 'update reviews') {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: `Sign in again to ${action}.` };
  }
  const staff = await getStaff();
  if (!staff || (await getUserRole(staff.uid)) !== ADMIN_ROLE) {
    return { ok: false, formError: `Only an Admin can ${action}.` };
  }
  return { ok: true };
}

export async function approveReview(id) {
  const access = await requireAdmin('update reviews');
  if (!access.ok) return access;
  const result = await setReviewStatus(id, REVIEW_STATUS_APPROVED);
  if (!result.ok) return result;
  revalidateReviewPaths();
  return { ok: true };
}

export async function rejectReview(id) {
  const access = await requireAdmin('update reviews');
  if (!access.ok) return access;
  const result = await setReviewStatus(id, REVIEW_STATUS_REJECTED);
  if (!result.ok) return result;
  revalidateReviewPaths();
  return { ok: true };
}

export async function markReviewSeen(id) {
  const access = await requireAdmin('update notifications');
  if (!access.ok) return access;
  const result = await markReviewNotificationSeen(id);
  if (!result.ok) return result;
  revalidatePath('/staff/notifications');
  return { ok: true };
}

export async function markAllReviewsSeen() {
  const access = await requireAdmin('update notifications');
  if (!access.ok) return access;
  await markAllReviewNotificationsSeen();
  revalidatePath('/staff/notifications');
  return { ok: true };
}
