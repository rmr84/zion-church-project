import { sendEmailVerification } from 'firebase/auth';

export async function sendAccountVerification(user) {
  const settings = { url: `${window.location.origin}/sign-in` };
  try {
    await sendEmailVerification(user, settings);
  } catch (caught) {
    if (caught?.code === 'auth/unauthorized-continue-uri' || caught?.code === 'auth/invalid-continue-uri') {
      await sendEmailVerification(user);
      return;
    }
    throw caught;
  }
}
