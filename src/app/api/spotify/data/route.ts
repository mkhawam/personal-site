import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNowPlaying, getAccessToken, getQueue } from '@/lib/spotify';

export async function GET() {
  const tokenData = await getAccessToken();

  if (!tokenData) {
      return NextResponse.json({ isConnected: false });
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

  const response = await getNowPlaying();
  const queueResponse = await getQueue();

  if (!response || response.status === 204 || response.status > 400) {
      return NextResponse.json({ isConnected: true, isPlaying: false });
  }

  const data = await response.json();
  let nextTracks: any[] = [];

  if (queueResponse && queueResponse.ok) {
      const queueData = await queueResponse.json();
      if (queueData.queue && queueData.queue.length > 0) {
          nextTracks = queueData.queue.slice(0, 3).map((track: any) => ({
              title: track.name,
              artist: track.artists.map((a: any) => a.name).join(', '),
              albumArt: track.album.images[0]?.url,
              uri: track.uri
          }));
      }
  }
  
  return NextResponse.json({
      isConnected: true,
      isPlaying: data.is_playing,
      title: data.item?.name,
      artist: data.item?.artists?.map((a: any) => a.name).join(', '),
      album: data.item?.album?.name,
      albumArt: data.item?.album?.images?.[0]?.url,
      progress: data.progress_ms,
      duration: data.item?.duration_ms,
      uri: data.item?.uri,
      nextTracks
  });
}
