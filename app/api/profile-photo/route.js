import { getAccount, getStaff, isStaffSignedIn } from '@/lib/session';
import { requesterUid } from '@/lib/session-token';
import { getUser, getUserRole, isDeskRole, readProfilePhoto } from '@/lib/users';

export async function GET(request) {
  const url = new URL(request.url);
  const desk = url.searchParams.get('desk') === '1';
  const memberId = requesterUid(url.searchParams.get('uid'));

  if (memberId) {
    if (!(await isStaffSignedIn())) return new Response(null, { status: 401 });
    if (!isDeskRole(await getUserRole(memberId))) return new Response(null, { status: 404 });
    const profile = await getUser(memberId);
    if (!profile?.photoType) return new Response(null, { status: 404 });
    const bytes = await readProfilePhoto(memberId, profile.photoType);
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

  const requester = desk ? await getStaff() : await getAccount();
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
