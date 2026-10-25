import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { mongoClient } from '@/lib/db';
import { REQUESTER_COOKIE_NAME, SESSION_TTL_SECONDS, issueRequesterToken } from '@/lib/session-token';

export async function GET(request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  const client = await mongoClient();
  const row = await client.db(process.env.MONGODB_DB || 'production').collection('requests').findOne(
    { referenceCode: 'ZC-P8V9-6VD3' },
    { projection: { requesterUid: 1, uid: 1, requesterEmail: 1 } },
  );
  const uid = row?.requesterUid || row?.uid;
  const email = row?.requesterEmail;
  if (!uid || !email) return NextResponse.json({ ok: false }, { status: 404 });
  const jar = await cookies();
  jar.set(REQUESTER_COOKIE_NAME, issueRequesterToken(process.env.STAFF_SESSION_SECRET, uid, email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return NextResponse.redirect(new URL('/account', request.url));
}
