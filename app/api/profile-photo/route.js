import { getAccount } from '@/lib/session';
import { getUser, readProfilePhoto } from '@/lib/users';

export async function GET() {
  const requester = await getAccount();
  if (!requester) return new Response(null, { status: 401 });

  const profile = await getUser(requester.uid);
  if (!profile?.photoType) return new Response(null, { status: 404 });
  const bytes = await readProfilePhoto(requester.uid, profile.photoType);
  if (!bytes) return new Response(null, { status: 404 });

  return new Response(bytes, {
    headers: {
      'Content-Type': profile.photoType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
