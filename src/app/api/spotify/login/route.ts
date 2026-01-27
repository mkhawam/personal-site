import { NextResponse, type NextRequest } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

export async function GET(request: NextRequest) {
  if (!client_id) {
    return NextResponse.json({ error: 'SPOTIFY_CLIENT_ID not set' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirect_uri = `${baseUrl}/api/spotify/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id,
    scope: scopes,
    redirect_uri,
    show_dialog: 'true'
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
