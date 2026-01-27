import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getStorage } from '@/lib/storage';

import { sendErrorToDiscord } from '@/lib/discord';

// Helper to get user from request
async function getUser(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user || typeof user !== 'object' || typeof user.id !== 'string') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const storage = getStorage();
    const data = await storage.get(user.id);
    
    if (!data) {
        return NextResponse.json({ empty: true }); // No data found
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Sync GET Error:", err);

    const errorMessage = err.message || String(err);
    if (errorMessage.includes("This store has been suspended")) {
         await sendErrorToDiscord(err, "Sync GET (Blob Suspended)");
         return NextResponse.json({ error: 'Sync Unavailable: Storage suspended' }, { status: 503 });
    }

    await sendErrorToDiscord(err, "Sync GET");
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user || typeof user !== 'object' || typeof user.id !== 'string') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { encryptedData, salt, iv, version, lastUpdated } = body;

    if (!encryptedData || !salt || !iv) {
        return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const storage = getStorage();

    // Optimistic Concurrency Control
    // If client sends 'lastUpdated', check if server has newer data
    // ALSO: If client sends NO 'lastUpdated' (null/undefined) but server HAS data, this is a blind overwrite. Reject it.
    const currentData = await storage.get(user.id);
    
    if (currentData && currentData.updatedAt) {
        if (!lastUpdated) {
             // Client is new/ignorant, but server has data. Do not overwrite.
             return NextResponse.json({ 
                 error: 'Conflict: Server has initialized data. Pull required.', 
                 serverUpdatedAt: currentData.updatedAt 
             }, { status: 409 });
        }

        const serverTime = new Date(currentData.updatedAt).getTime();
        const clientTime = new Date(lastUpdated).getTime();
        
        // Allow 1s clock skew, but if server is significantly ahead, reject
        if (serverTime > clientTime + 1000) {
             return NextResponse.json({ 
                 error: 'Conflict: Server has newer data', 
                 serverUpdatedAt: currentData.updatedAt 
             }, { status: 409 });
        }
    }

    await storage.set(user.id, { 
        encryptedData, 
        salt, 
        iv, 
        version, 
        updatedAt: new Date().toISOString() 
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Sync POST Error:", err);

    const errorMessage = err.message || String(err);
    if (errorMessage.includes("This store has been suspended")) {
         await sendErrorToDiscord(err, "Sync POST (Blob Suspended)");
         return NextResponse.json({ error: 'Sync Unavailable: Storage suspended' }, { status: 503 });
    }

    await sendErrorToDiscord(err, "Sync POST");
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
