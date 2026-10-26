'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  createFirebaseAuthUser,
  deleteFirebaseAuthUser,
  sendFirebasePasswordReset,
} from '@/lib/firebase-auth-admin';
import { buildInviteNotice, logNotice } from '@/lib/notify';
import { getStaff, isStaffSignedIn } from '@/lib/session';
import {
  ADMIN_ROLE,
  CARE_TEAM_ROLE,
  deletePendingDeskUser,
  getUserRole,
  inviteDeskUser,
  removeDeskUserRecord,
  roleLabel,
  usersCollection,
} from '@/lib/users';

async function requireAdmin(action = 'invite users') {
  if (!(await isStaffSignedIn())) {
    return { ok: false, formError: `Sign in again to ${action}.` };
  }
  const staff = await getStaff();
  if (!staff || (await getUserRole(staff.uid)) !== ADMIN_ROLE) {
    return { ok: false, formError: `Only an Admin can ${action}.` };
  }
  return { ok: true, staff };
}

async function staffLoginUrl() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/staff/login`;
}

export async function inviteUser({ email, role, firstName = '', lastName = '' } = {}) {
  const access = await requireAdmin('invite users');
  if (!access.ok) return access;

  const nextRole = role === ADMIN_ROLE ? ADMIN_ROLE : role === CARE_TEAM_ROLE || role === 'Care Team'
    ? CARE_TEAM_ROLE
    : '';
  if (!nextRole) return { ok: false, formError: 'Choose Admin or Care Team.' };

  const address = String(email || '').trim().toLowerCase();
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 200) {
    return { ok: false, formError: 'Enter a valid email address.' };
  }

  const users = await usersCollection();
  const existing = await users.findOne(
    { email: address },
    { projection: { _id: 1 } },
  );
  if (existing) {
    return { ok: false, formError: 'An account with that email already exists.' };
  }

  // Temporary fixed invite password for testing Firebase reset delivery.
  const authUser = await createFirebaseAuthUser(address, 'Test12345!');
  if (!authUser.ok) return authUser;
  if (!authUser.created) {
    return { ok: false, formError: 'An account with that email already exists.' };
  }

  const saved = await inviteDeskUser({
    email: address,
    role: nextRole,
    uid: authUser.uid,
    firstName,
    lastName,
    invitePassword: authUser.password,
    inviteRefreshToken: authUser.refreshToken,
  });
  if (!saved.ok) {
    await deleteFirebaseAuthUser({
      email: address,
      password: authUser.password,
      refreshToken: authUser.refreshToken,
    }).catch(() => {});
    return saved;
  }

  const loginUrl = await staffLoginUrl();
  const mailed = await sendFirebasePasswordReset(address, loginUrl);
  if (!mailed.ok) {
    await deleteFirebaseAuthUser({
      email: address,
      password: authUser.password,
      refreshToken: authUser.refreshToken,
    }).catch(() => {});
    await removeDeskUserRecord({ uid: authUser.uid, email: address }).catch(() => {});
    return mailed;
  }

  logNotice(buildInviteNotice({
    email: address,
    roleLabel: roleLabel(nextRole),
    loginUrl,
  }));

  revalidatePath('/staff/users');
  revalidatePath('/staff/email-logs');
  return { ok: true };
}

export async function deletePendingUser({ uid = '', email = '' } = {}) {
  const access = await requireAdmin('delete users');
  if (!access.ok) return access;

  const address = String(email || '').trim().toLowerCase();
  if (access.staff?.email && address && access.staff.email === address) {
    return { ok: false, formError: 'You cannot delete your own account.' };
  }
  if (access.staff?.uid && uid && access.staff.uid === uid) {
    return { ok: false, formError: 'You cannot delete your own account.' };
  }

  const pending = await deletePendingDeskUser({ uid, email: address });
  if (!pending.ok) return pending;

  const firebaseUid = String(pending.uid || '');
  const hasFirebaseAccount = Boolean(firebaseUid) && !firebaseUid.startsWith('invite');
  let firebaseWarning = '';
  if (hasFirebaseAccount) {
    const removed = await deleteFirebaseAuthUser({
      email: pending.email,
      password: pending.invitePassword,
      refreshToken: pending.inviteRefreshToken,
      passwords: ['Test12345!'],
    });
    if (!removed.ok) {
      // Still clear the desk record so pending invites are not stuck.
      firebaseWarning = removed.formError
        || 'Desk invite removed, but the Firebase Auth user is still there. Delete it in the Firebase console.';
    }
  }

  const deleted = await removeDeskUserRecord({
    uid: pending.uid,
    email: pending.email,
  });
  if (!deleted.ok) return deleted;

  revalidatePath('/staff/users');
  if (firebaseWarning) {
    return { ok: true, warning: firebaseWarning };
  }
  return { ok: true };
}
