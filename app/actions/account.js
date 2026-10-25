'use server';

import { getAccount } from '@/lib/session';
import { cleanProfileName, cleanProfilePhone, detectedPhotoType, photoProblem, profileNameProblem, profilePhoneProblem } from '@/lib/profile';
import { deleteProfilePhoto, saveProfilePhoto, updateUserProfile } from '@/lib/users';

const NOTIFICATION_FIELDS = new Set(['emailNotifications', 'inAppNotifications']);

export async function saveRequesterProfile(formData) {
  const requester = await getAccount();
  if (!requester) return { ok: false, formError: 'Sign in again to update this account.' };

  const firstName = cleanProfileName(formData.get('firstName'));
  const lastName = cleanProfileName(formData.get('lastName'));
  const phone = cleanProfilePhone(formData.get('phone'));
  const errors = {};
  const firstProblem = profileNameProblem(firstName, 'first name');
  const lastProblem = profileNameProblem(lastName, 'last name');
  const phoneProblem = profilePhoneProblem(phone);
  if (firstProblem) errors.firstName = firstProblem;
  if (lastProblem) errors.lastName = lastProblem;
  if (phoneProblem) errors.phone = phoneProblem;

  const picture = formData.get('photo');
  const hasPicture = picture && typeof picture === 'object' && picture.size > 0;
  if (hasPicture) {
    const problem = photoProblem(picture.type, picture.size);
    if (problem) errors.photo = problem;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const fields = { firstName, lastName, phone };
  if (hasPicture) {
    const bytes = new Uint8Array(await picture.arrayBuffer());
    const type = detectedPhotoType(bytes, picture.type);
    if (!type) return { ok: false, errors: { photo: 'Use a PNG, JPG, GIF, or SVG.' } };
    await saveProfilePhoto(requester.uid, bytes, type);
    fields.photoType = type;
    fields.photoUpdatedAt = new Date().toISOString();
  }

  try {
    await updateUserProfile(requester.uid, requester.email, fields);
  } catch (error) {
    console.error('Could not save the care requester profile.', error?.code || '');
    return { ok: false, formError: 'That profile could not be saved. Try again.' };
  }

  return { ok: true, photoUpdatedAt: fields.photoUpdatedAt || '' };
}

export async function removeRequesterPhoto() {
  const requester = await getAccount();
  if (!requester) return { ok: false, formError: 'Sign in again to update this account.' };
  try {
    await deleteProfilePhoto(requester.uid);
    await updateUserProfile(requester.uid, requester.email, { photoType: '', photoUpdatedAt: '' });
  } catch (error) {
    console.error('Could not remove the profile picture.', error?.code || '');
    return { ok: false, formError: 'That picture could not be removed. Try again.' };
  }
  return { ok: true };
}

export async function saveNotificationPreference(field, enabled) {
  const requester = await getAccount();
  if (!requester || !NOTIFICATION_FIELDS.has(field)) return { ok: false };
  try {
    await updateUserProfile(requester.uid, requester.email, { [field]: enabled === true });
  } catch (error) {
    console.error('Could not save the notification setting.', error?.code || '');
    return { ok: false };
  }
  return { ok: true };
}
