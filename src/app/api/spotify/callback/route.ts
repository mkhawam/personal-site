import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirect_uri = `${baseUrl}/api/spotify/callback`;

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    }),
  });

  const data = await response.json();

  if (data.error) {
     return NextResponse.json({ error: data.error }, { status: 400 });
  }

  const cookieStore = await cookies();
  
  // Set Access Token (1 hour)
  cookieStore.set('spotify_access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.expires_in
  });

  // Set Refresh Token (Indefinite/Long)
  if (data.refresh_token) {
      cookieStore.set('spotify_refresh_token', data.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 // 30 days
      });
  }

  return NextResponse.redirect(`${baseUrl}/tasks`);
}
