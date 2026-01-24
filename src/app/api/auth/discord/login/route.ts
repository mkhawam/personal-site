import { NextResponse } from 'next/server';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BASE_URL}/api/auth/discord/callback`;

if (!DISCORD_CLIENT_ID) {
  console.error('Missing DISCORD_CLIENT_ID');
}

export async function GET() {
  const scope = encodeURIComponent('identify email');
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
  
  return NextResponse.redirect(url);
}
