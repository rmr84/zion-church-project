import { NextResponse } from 'next/server';
import { normalizeReferenceCode } from '@/lib/reference';
import { getMemberRequest } from '@/lib/requests';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const code = normalizeReferenceCode(new URL(request.url).searchParams.get('code'));
  const headers = { 'Cache-Control': 'no-store' };

  if (!code) {
    return NextResponse.json({ error: 'Enter a reference code.' }, { status: 400, headers });
  }

  const result = getMemberRequest(code);
  if (!result) {
    return NextResponse.json({ error: 'No request matches that code.' }, { status: 404, headers });
  }

  return NextResponse.json(result, { headers });
}
