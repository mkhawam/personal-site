import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Helper to get user from request
async function getUser(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Data Directory
const DATA_DIR = path.join(process.cwd(), 'data', 'users');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore error if exists
  }
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user || typeof user !== 'object' || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${user.id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (err: any) {
    if (err.code === 'ENOENT') {
        return NextResponse.json({ empty: true }); // No data found
    }
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user || typeof user !== 'object' || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { encryptedData, salt, iv, version } = body;

    if (!encryptedData || !salt || !iv) {
        return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${user.id}.json`);
    
    // Save blob
    await fs.writeFile(filePath, JSON.stringify({ 
        encryptedData, 
        salt, 
        iv, 
        version, 
        updatedAt: new Date().toISOString() 
    }), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
