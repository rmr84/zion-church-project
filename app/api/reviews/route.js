import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createPendingReview } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, formError: 'Feedback could not be read.' }, { status: 400 });
  }

  const result = await createPendingReview({
    referenceCode: body.referenceCode,
    quote: body.quote,
    name: body.name,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  revalidatePath('/staff/notifications');
  revalidatePath('/staff/reviews');
  return NextResponse.json(result, { status: 201 });
}
