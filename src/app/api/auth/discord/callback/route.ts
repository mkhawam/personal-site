import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_OPTIONS, safeReturnTo, signToken } from '@/lib/auth';
import { sendErrorToDiscord } from '@/lib/discord';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const ALLOWED_EMAILS = (process.env.ALLOWED_DISCORD_EMAILS || '').split(',').map(e => e.trim());

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');

  // Must match the login route's derivation byte-for-byte (token exchange
  // validates redirect_uri) and fixes dev on https://localhost:3001.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  // Discord error bounce (user denied consent, etc.) → /login dead-end, never
  // back to /tasks (which would loop through the proxy's auth redirect).
  if (searchParams.get('error')) {
    return NextResponse.redirect(new URL('/login?error=oauth', baseUrl));
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Discord Token Error:', tokenData);
      await sendErrorToDiscord(new Error(`Discord Token Error: ${JSON.stringify(tokenData)}`), "Auth Callback (Token Exchange)");
      return NextResponse.redirect(new URL('/login?error=oauth', baseUrl));
    }

    // 2. Fetch user profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    // 3. Check whitelist (if Configured)
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(userData.email)) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', baseUrl));
    }

    // 4. Create Session
    const token = await signToken({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : null
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, AUTH_COOKIE_OPTIONS);

    // state carries returnTo; re-validate server-side, never trust the round-trip.
    return NextResponse.redirect(new URL(safeReturnTo(searchParams.get('state')), baseUrl));

  } catch (err) {
    console.error('Auth Error:', err);
    await sendErrorToDiscord(err, "Auth Callback (Fatal)");
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
