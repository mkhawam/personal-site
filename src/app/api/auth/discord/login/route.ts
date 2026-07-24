import { NextResponse, type NextRequest } from 'next/server';
import { safeReturnTo } from '@/lib/auth';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

export async function GET(request: NextRequest) {
  if (!DISCORD_CLIENT_ID) {
    console.error('Missing DISCORD_CLIENT_ID');
    return NextResponse.json({ error: 'OAuth is not configured' }, { status: 500 });
  }

  // Derive from the live origin so dev (https://localhost:3001) works without env
  // overrides; NEXT_PUBLIC_BASE_URL still wins when set (same pattern as spotify/login).
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const scope = encodeURIComponent('identify email');
  const url =
    `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}` +
    `&state=${encodeURIComponent(returnTo)}`;

  return NextResponse.redirect(url);
}
