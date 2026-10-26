'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  createFirebaseAuthUser,
  sendFirebasePasswordReset,
} from '@/lib/firebase-auth-admin';
import { buildInviteNotice, logNotice } from '@/lib/notify';
import { getStaff, isStaffSignedIn } from '@/lib/session';
import {
  ADMIN_ROLE,
  CARE_TEAM_ROLE,
  getUserRole,
  inviteDeskUser,
  roleLabel,
} from '@/lib/users';

async function requireAdmin() {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: 'Sign in again to invite a user.' };
  }
  const staff = await getStaff();
  if (!staff || (await getUserRole(staff.uid)) !== ADMIN_ROLE) {
    return { ok: false, formError: 'Only an Admin can invite users.' };
  }
  return { ok: true };
}

async function staffLoginUrl() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/staff/login`;
}

export async function inviteUser(email, role) {
  const access = await requireAdmin();
  if (!access.ok) return access;

  const nextRole = role === ADMIN_ROLE ? ADMIN_ROLE : role === CARE_TEAM_ROLE || role === 'Care Team'
    ? CARE_TEAM_ROLE
    : '';
  if (!nextRole) return { ok: false, formError: 'Choose Admin or Care Team.' };

  const address = String(email || '').trim().toLowerCase();
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 200) {
    return { ok: false, formError: 'Enter a valid email address.' };
  }

  const authUser = await createFirebaseAuthUser(address);
  if (!authUser.ok) return authUser;

  const saved = await inviteDeskUser({
    email: address,
    role: nextRole,
    uid: authUser.uid,
  });
  if (!saved.ok) return saved;

  const loginUrl = await staffLoginUrl();
  const mailed = await sendFirebasePasswordReset(address, loginUrl);
  if (!mailed.ok) return mailed;

  logNotice(buildInviteNotice({
    email: address,
    roleLabel: roleLabel(nextRole),
    loginUrl,
  }));

  revalidatePath('/staff/users');
  revalidatePath('/staff/notifications');
  return { ok: true, alreadyMember: saved.alreadyMember === true };
}
