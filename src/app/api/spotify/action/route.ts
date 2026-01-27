import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { playerAction, getAccessToken } from '@/lib/spotify';

export async function POST(request: NextRequest) {
  const tokenData = await getAccessToken();

  if (!tokenData) {
      return NextResponse.json({ error: 'Not connected' }, { status: 401 });
  }

   // Update cookie if refreshed
  if (tokenData.is_new) {
       const cookieStore = await cookies();
       cookieStore.set('spotify_access_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokenData.expires_in
      });
  }

  const { action, uri } = await request.json();

  if (!['play', 'pause', 'next', 'previous', 'play_track'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  let response;
  if (action === 'play_track' && uri) {
      // Need to import playTrack
      const { playTrack } = await import('@/lib/spotify'); 
      response = await playTrack(uri);
  } else {
      response = await playerAction(action as any);
  }

  if (response && response.ok) {
      return NextResponse.json({ success: true });
  } else {
      return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 });
  }
}
