// Ensures the attachments bucket exists and allows browser CORS (MinIO/S3).
// Reads S3_* from the environment (apps/api/.env). Idempotent.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

// minimal .env loader (no dependency on dotenv)
const here = dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(join(here, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* env optional */
}

const Bucket = process.env.S3_BUCKET;
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
  forcePathStyle: true,
});

try {
  await client.send(new HeadBucketCommand({ Bucket }));
  console.log(`Bucket "${Bucket}" already exists.`);
} catch {
  await client.send(new CreateBucketCommand({ Bucket }));
  console.log(`Created bucket "${Bucket}".`);
}

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    }),
  );
  console.log('CORS configured.');
} catch {
  // MinIO is permissive on CORS by default and rejects the SDK's checksum header
  // on PutBucketCors — safe to ignore for local dev.
  console.log('CORS step skipped (MinIO default CORS is permissive).');
}

