'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import { removeRequesterPhoto, saveNotificationPreference, saveRequesterProfile } from '@/app/actions/account';
import { PasswordInput } from '@/components/PasswordInput';
import { SignOutButton } from '@/components/SignOutButton';
import { useToast } from '@/components/Toast';
import { firebaseApp } from '@/lib/firebase';
import { passwordProblem } from '@/lib/password-rules';
import { photoProblem } from '@/lib/profile';

function photoUrl(stamp) {
  return stamp ? `/api/profile-photo?v=${encodeURIComponent(stamp)}` : '';
}

function PasswordField({ id, label, autoComplete, value, onChange, invalid, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}<span className="required" aria-hidden="true">*</span></label>
      <PasswordInput id={id} autoComplete={autoComplete} value={value} onChange={onChange} invalid={invalid} />
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.6 19.1c1.35-3.05 3.55-4.45 6.4-4.45s5.05 1.4 6.4 4.45" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AccountSettings({ profile }) {
  const router = useRouter();
  const showToast = useToast();
  const [saved, setSaved] = useState(profile);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone || '');
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(photoUrl(profile.photoUpdatedAt));
  const [over, setOver] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState('');
  const [profilePending, setProfilePending] = useState(false);
  const [notes, setNotes] = useState({
    emailNotifications: profile.emailNotifications,
    inAppNotifications: profile.inAppNotifications,
  });
  const [noteError, setNoteError] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);

  function choosePicture(file) {
    if (!file) return;
    const problem = photoProblem(file.type, file.size);
    if (problem) {
      setProfileErrors((current) => ({ ...current, photo: problem }));
      return;
    }
    setProfileErrors((current) => ({ ...current, photo: '' }));
    setPicture(file);
    setPreview(URL.createObjectURL(file));
  }

  function resetProfile() {
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setPhone(saved.phone || '');
    setPicture(null);
    setPreview(photoUrl(saved.photoUpdatedAt));
    setProfileErrors({});
    setProfileMessage('');
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage('');
    setProfilePending(true);
    const data = new FormData(event.currentTarget);
    if (picture) data.set('photo', picture);
    const result = await saveRequesterProfile(data);
    setProfilePending(false);
    if (!result?.ok) {
      setProfileErrors(result?.errors || {});
      setProfileMessage(result?.formError || '');
      return;
    }
    const nextSaved = {
      ...saved,
      firstName: String(data.get('firstName') || '').trim(),
      lastName: String(data.get('lastName') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      photoUpdatedAt: result.photoUpdatedAt || saved.photoUpdatedAt,
      photoType: result.photoUpdatedAt ? 'saved' : saved.photoType,
    };
    setSaved(nextSaved);
    setPicture(null);
    if (result.photoUpdatedAt) setPreview(photoUrl(result.photoUpdatedAt));
    setProfileErrors({});
    setProfileMessage('');
    showToast?.('Profile saved.');
    router.refresh();
  }

  async function removePicture() {
    setProfileErrors((current) => ({ ...current, photo: '' }));
    if (picture) {
      setPicture(null);
      setPreview(saved.photoType ? photoUrl(saved.photoUpdatedAt) : '');
      return;
    }
    if (!saved.photoType) {
      setPreview('');
      return;
    }
    setPreview('');
    const result = await removeRequesterPhoto();
    if (!result?.ok) {
      setPreview(photoUrl(saved.photoUpdatedAt));
      setProfileMessage(result?.formError || 'That picture could not be removed. Try again.');
      return;
    }
    setSaved((current) => ({ ...current, photoType: '', photoUpdatedAt: '' }));
    setProfileMessage('');
    router.refresh();
  }

  async function toggleNote(field, enabled) {
    const previous = notes[field];
    setNotes((current) => ({ ...current, [field]: enabled }));
    setNoteError('');
    const result = await saveNotificationPreference(field, enabled);
    if (!result?.ok) {
      setNotes((current) => ({ ...current, [field]: previous }));
      setNoteError('That setting could not be saved. Try again.');
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    const errors = {};
    if (!passwords.current) errors.current = 'Enter your current password.';
    const problem = passwordProblem(passwords.next);
    if (!passwords.next) errors.next = 'Enter a new password.';
    else if (problem) errors.next = problem;
    if (!passwords.confirm) errors.confirm = 'Confirm your new password.';
    else if (!errors.next && passwords.next !== passwords.confirm) errors.confirm = 'Those passwords do not match.';
    setPasswordErrors(errors);
    setPasswordMessage('');
    if (Object.keys(errors).length > 0) return;

    setPasswordPending(true);
    try {
      const auth = getAuth(firebaseApp);
      let user = auth.currentUser;
      if (!user || user.email !== profile.email) {
        const signedIn = await signInWithEmailAndPassword(auth, profile.email, passwords.current);
        user = signedIn.user;
      } else {
        const credential = EmailAuthProvider.credential(profile.email, passwords.current);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(user, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordMessage('');
      showToast?.('Password updated.');
    } catch (caught) {
      const code = caught?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/invalid-login-credentials') {
        setPasswordErrors({ current: 'That current password did not match.' });
      } else if (code === 'auth/weak-password') {
        setPasswordErrors({ next: 'Password needs at least 8 characters, one capital letter, and one number or special character.' });
      } else if (code === 'auth/too-many-requests') {
        setPasswordMessage('Too many attempts. Wait a moment and try again.');
      } else {
        setPasswordMessage('That password could not be updated. Try again.');
      }
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="settings-stack">
      <form className="settings-card" onSubmit={saveProfile} noValidate>
        <div>
          <h2>Personal Details</h2>
          <p>Update the name, phone, and picture on this account.</p>
        </div>
        <div className="settings-fields">
          {profileMessage ? <p className="banner error" role="alert">{profileMessage}</p> : null}
          <div className="settings-names">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" name="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" aria-invalid={Boolean(profileErrors.firstName)} />
              {profileErrors.firstName ? <p className="field-error">{profileErrors.firstName}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" name="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" aria-invalid={Boolean(profileErrors.lastName)} />
              {profileErrors.lastName ? <p className="field-error">{profileErrors.lastName}</p> : null}
            </div>
          </div>
          <div className="field">
            <label htmlFor="account-phone">Phone number</label>
            <input id="account-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} aria-invalid={Boolean(profileErrors.phone)} />
            {profileErrors.phone ? <p className="field-error">{profileErrors.phone}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" value={profile.email} disabled readOnly autoComplete="email" />
          </div>
          <div
            className={`photo-drop${preview ? ' has-photo' : ''}${over ? ' is-over' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setOver(false);
              choosePicture(event.dataTransfer.files?.[0]);
            }}
          >
            {preview ? (
              <div className="photo-frame">
                <label className="photo-replace">
                  <img className="photo-preview" src={preview} alt="" />
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/svg+xml"
                    onChange={(event) => choosePicture(event.target.files?.[0])}
                  />
                </label>
                <button className="photo-remove" type="button" aria-label="Remove profile picture" onClick={removePicture}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <label>
                <span className="photo-placeholder"><PersonIcon /></span>
                <span className="photo-title">Click to upload or drag and drop</span>
                <span className="hint">PNG, JPG, GIF, or SVG. Max 10MB.</span>
                <input
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/svg+xml"
                  onChange={(event) => choosePicture(event.target.files?.[0])}
                />
              </label>
            )}
          </div>
          {profileErrors.photo ? <p className="field-error">{profileErrors.photo}</p> : null}
          <div className="settings-actions">
            <button className="button secondary" type="button" onClick={resetProfile}>Cancel</button>
            <button className="button" type="submit" disabled={profilePending}>{profilePending ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>


      <form className="settings-card" onSubmit={savePassword} noValidate>
        <div>
          <h2>Password</h2>
          <p>Update the password for this account.</p>
        </div>
        <div className="settings-fields">
          {passwordMessage ? <p className="banner error" role="alert">{passwordMessage}</p> : null}
          <PasswordField id="current-password" label="Current password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} invalid={Boolean(passwordErrors.current)} error={passwordErrors.current} />
          <PasswordField id="new-password" label="New password" autoComplete="new-password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} invalid={Boolean(passwordErrors.next)} error={passwordErrors.next} />
          <PasswordField id="confirm-password" label="Confirm password" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} invalid={Boolean(passwordErrors.confirm)} error={passwordErrors.confirm} />
          <div className="settings-actions">
            <button className="button secondary" type="button" onClick={() => { setPasswords({ current: '', next: '', confirm: '' }); setPasswordErrors({}); setPasswordMessage(''); }}>Cancel</button>
            <button className="button" type="submit" disabled={passwordPending}>{passwordPending ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>

      <div className="account-sign-out"><SignOutButton /></div>
    </div>
  );
}
