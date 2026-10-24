'use server';

import { getRequester } from '@/lib/session';
import { cleanProfileName, detectedPhotoType, photoProblem, profileNameProblem } from '@/lib/profile';
import { deleteProfilePhoto, saveProfilePhoto, updateUserProfile } from '@/lib/users';

const NOTIFICATION_FIELDS = new Set(['emailNotifications', 'inAppNotifications']);

export async function saveRequesterProfile(formData) {
  const requester = await getRequester();
  if (!requester) return { ok: false, formError: 'Sign in again to update this account.' };

  const firstName = cleanProfileName(formData.get('firstName'));
  const lastName = cleanProfileName(formData.get('lastName'));
  const errors = {};
  const firstProblem = profileNameProblem(firstName, 'first name');
  const lastProblem = profileNameProblem(lastName, 'last name');
  if (firstProblem) errors.firstName = firstProblem;
  if (lastProblem) errors.lastName = lastProblem;

  const picture = formData.get('photo');
  const hasPicture = picture && typeof picture === 'object' && picture.size > 0;
  if (hasPicture) {
    const problem = photoProblem(picture.type, picture.size);
    if (problem) errors.photo = problem;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const fields = { firstName, lastName };
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
  const requester = await getRequester();
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
  const requester = await getRequester();
  if (!requester || !NOTIFICATION_FIELDS.has(field)) return { ok: false };
  try {
    await updateUserProfile(requester.uid, requester.email, { [field]: enabled === true });
  } catch (error) {
    console.error('Could not save the notification setting.', error?.code || '');
    return { ok: false };
  }
  return { ok: true };
}
