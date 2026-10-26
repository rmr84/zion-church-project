'use server';

import { revalidatePath } from 'next/cache';
import {
  markAllAssignmentNotificationsSeen,
  markAssignmentNotificationSeen,
  markAssignmentNotificationsSeen,
} from '@/lib/desk-notifications';
import { markAllReviewNotificationsSeen } from '@/lib/reviews';
import { getStaff, isStaffSignedIn } from '@/lib/session';
import { ADMIN_ROLE, getUserRole } from '@/lib/users';

function revalidateNotificationPaths() {
  revalidatePath('/staff/notifications');
  revalidatePath('/staff', 'layout');
}

async function requireStaff() {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: 'Sign in again to update notifications.' };
  }
  const staff = await getStaff();
  if (!staff) return { ok: false, formError: 'Sign in again to update notifications.' };
  return { ok: true, staff };
}

export async function markAssignmentSeen(id) {
  const access = await requireStaff();
  if (!access.ok) return access;
  const result = await markAssignmentNotificationSeen(id, access.staff.uid);
  if (!result.ok) return result;
  revalidateNotificationPaths();
  return { ok: true };
}

export async function markSelectedAssignmentsSeen(ids) {
  const access = await requireStaff();
  if (!access.ok) return access;
  const result = await markAssignmentNotificationsSeen(ids, access.staff.uid);
  if (!result.ok) return result;
  revalidateNotificationPaths();
  return { ok: true };
}

export async function markAllAssignmentsSeen() {
  const access = await requireStaff();
  if (!access.ok) return access;
  const result = await markAllAssignmentNotificationsSeen(access.staff.uid);
  if (!result.ok) return result;
  revalidateNotificationPaths();
  return { ok: true };
}

export async function markAllDeskNotifications({ includeReviews = false } = {}) {
  const access = await requireStaff();
  if (!access.ok) return access;
  const result = await markAllAssignmentNotificationsSeen(access.staff.uid);
  if (!result.ok) return result;
  if (includeReviews && (await getUserRole(access.staff.uid)) === ADMIN_ROLE) {
    await markAllReviewNotificationsSeen();
  }
  revalidateNotificationPaths();
  return { ok: true };
}
