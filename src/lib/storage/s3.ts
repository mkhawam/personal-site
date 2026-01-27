import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SyncStorage } from '../storage';
import { sendErrorToDiscord } from '../discord';

export class S3Storage implements SyncStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = process.env.S3_BUCKET!;
  }

  async get(userId: string): Promise<any | null> {
    const key = `users/${userId}.json`;
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      const str = await response.Body?.transformToString();

      if (!str) return null;
      return JSON.parse(str);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') return null;
      
      console.error('S3 Get Error:', error);

      // Check for common configuration error: Pointing to Web UI instead of API
      const msg = error.message || '';
      if (msg.includes('Expected closing tag') || msg.includes('Deserialization error')) {
         const warning = 'FATAL CONFIG: S3 Client received HTML instead of XML. You are likely pointing S3_ENDPOINT to the MinIO Console (Port 9001) or a Cloudflare Login page instead of the API (Port 9000).';
         console.error(warning);
         await sendErrorToDiscord(new Error(warning + ` Original: ${msg}`), "S3 Configuration Error");
      } else {
         await sendErrorToDiscord(error, "S3 Get Error");
      }

      throw error;
    }
  }

  async set(userId: string, data: any): Promise<void> {
    const key = `users/${userId}.json`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json',
      });

      await this.client.send(command);
    } catch (error) {
      await sendErrorToDiscord(error, "S3 Put Error");
      console.error('S3 Put Error:', error);
      throw error;
    }
  }
}
