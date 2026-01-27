import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function GET() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;

  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  log(`Checking S3 Configuration...`);
  log(`Endpoint: ${endpoint}`);
  log(`AccessKey: ${accessKey ? 'Set' : 'Missing'}`);
  log(`Bucket: ${bucket}`);

  try {
    if (!endpoint) throw new Error('S3_ENDPOINT is not set');

    // 1. Raw Fetch Test to see what the server returns for a simple GET
    log('\n--- Raw Fetch Test (Root) ---');
    try {
      const res = await fetch(endpoint);
      log(`Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      log(`Content-Type: ${res.headers.get('content-type')}`);
      log(`Body Preview (First 500 chars):\n${text.slice(0, 500)}`);
    } catch (e: any) {
      log(`Raw Fetch Error: ${e.message}`);
    }

    // 2. SDK Test
    log('\n--- AWS SDK ListBuckets Test ---');
    const client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: accessKey!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });

    try {
      const command = new ListBucketsCommand({});
      const result = await client.send(command);
      log(`Success! Found ${result.Buckets?.length || 0} buckets.`);
    } catch (e: any) {
      log(`SDK Error Name: ${e.name}`);
      log(`SDK Error Message: ${e.message}`);
      if (e.$response) {
         log(`SDK Raw Response Status: ${e.$response.statusCode}`);
      }
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}
