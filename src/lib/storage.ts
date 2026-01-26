import { put, list, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

export interface SyncStorage {
  get(userId: string): Promise<any | null>;
  set(userId: string, data: any): Promise<void>;
}

/**
 * Storage implementation using Vercel Blob.
 * Requires BLOB_READ_WRITE_TOKEN env var.
 */
class VercelBlobStorage implements SyncStorage {
  async get(userId: string): Promise<any | null> {
    const blobName = `users/${userId}.json`;
    try {
        // List to find the blob url (since we might not know the exact URL if suffix was added, 
        // but we try to keep it stable)
        const { blobs } = await list({ prefix: blobName, limit: 1 });
        
        if (blobs.length === 0) return null;
        
        // Fetch the content
        const response = await fetch(blobs[0].url);
        if (!response.ok) return null;
        
        return await response.json();
    } catch (error) {
        console.error("Vercel Blob Get Error:", error);
        return null;
    }
  }

  async set(userId: string, data: any): Promise<void> {
    const blobName = `users/${userId}.json`;
    // We overwrite by using the same path and addRandomSuffix: false
    await put(blobName, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false // Ensure we overwrite the file at this path
    });
  }
}

/**
 * Storage implementation using local filesystem.
 * Stores data in /data/users/{userId}.json
 */
class FileSystemStorage implements SyncStorage {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'users');
  }

  private async ensureDir() {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  async get(userId: string): Promise<any | null> {
    try {
      await this.ensureDir();
      const filePath = path.join(this.dataDir, `${userId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async set(userId: string, data: any): Promise<void> {
    await this.ensureDir();
    const filePath = path.join(this.dataDir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
  }
}

// Factory to choose the right storage
export function getStorage(): SyncStorage {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobStorage();
  }
  return new FileSystemStorage();
}
