import { redirect } from 'next/navigation';
import { signOutStaff } from '@/lib/session';

export async function GET() {
  await signOutStaff();
  redirect('/staff/login?again=account');
}
