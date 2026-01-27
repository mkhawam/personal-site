import { cookies } from 'next/headers';
import { sendErrorToDiscord } from '@/lib/discord';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const PLAYERS_ENDPOINT = `https://api.spotify.com/v1/me/player`;

export const getAccessToken = async () => {
  const cookieStore = await cookies();
  const refresh_token = cookieStore.get('spotify_refresh_token')?.value;
  const access_token = cookieStore.get('spotify_access_token')?.value;

  if (access_token) {
    return { access_token, is_new: false };
  }

  if (refresh_token) {
    // Refresh the token
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to refresh token", errorText);
        await sendErrorToDiscord(new Error(`Spotify Token Refresh Failed: ${errorText}`), "Spotify Service");
        return null;
    }

    const data = await response.json();
    return { access_token: data.access_token, is_new: true, expires_in: data.expires_in };
  }

  return null;
};

export const getNowPlaying = async () => {
  const tokenData = await getAccessToken();
  if (!tokenData) return null;

  return fetch(`${PLAYERS_ENDPOINT}/currently-playing`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
};

export const getPlayerState = async () => {
    const tokenData = await getAccessToken();
    if (!tokenData) return null;
  
    return fetch(PLAYERS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
};

export const playerAction = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    const tokenData = await getAccessToken();
    if (!tokenData) return null;
    
    let url = `${PLAYERS_ENDPOINT}/${action}`;
    let method = 'POST';
    
    if (action === 'play' || action === 'pause') {
        method = 'PUT';
    }

    return fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
        },
    });
};

export const getQueue = async () => {
    const tokenData = await getAccessToken();
    if (!tokenData) return null;
  
    return fetch(`${PLAYERS_ENDPOINT}/queue`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
};

export const playTrack = async (uri: string) => {
    const tokenData = await getAccessToken();
    if (!tokenData) return null;
    
    return fetch(`${PLAYERS_ENDPOINT}/play`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({uris: [uri]})
    });
};
