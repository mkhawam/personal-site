import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';
import { sendErrorToDiscord } from '@/lib/discord';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/api/auth/discord/callback`;
const ALLOWED_EMAILS = (process.env.ALLOWED_DISCORD_EMAILS || '').split(',').map(e => e.trim());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

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
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Discord Token Error:', tokenData);
      await sendErrorToDiscord(new Error(`Discord Token Error: ${JSON.stringify(tokenData)}`), "Auth Callback (Token Exchange)");
      return NextResponse.json({ error: tokenData.error_description || 'Failed to extract token' }, { status: 400 });
    }

    // 2. Fetch user profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const userData = await userResponse.json();
    
    // 3. Check whitelist (if Configured)
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(userData.email)) {
      return NextResponse.json({ error: 'User not authorized' }, { status: 403 });
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
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.redirect(`${BASE_URL}/tasks`);

  } catch (err) {
    console.error('Auth Error:', err);
    await sendErrorToDiscord(err, "Auth Callback (Fatal)");
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
