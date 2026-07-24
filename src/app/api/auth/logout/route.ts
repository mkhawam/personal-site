import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_OPTIONS } from '@/lib/auth';

// POST-only so a stray <img src> can't log the user out.
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', '', { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
  return NextResponse.json({ success: true });
}
