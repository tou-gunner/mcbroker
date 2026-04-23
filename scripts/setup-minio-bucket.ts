import 'dotenv/config';
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const region = process.env.S3_REGION ?? 'us-east-1';

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  console.error('Missing S3 env vars');
  process.exit(1);
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✓ Bucket "${bucket}" already exists`);
    return;
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode !== 404 && err.name !== 'NotFound') {
      console.log(`HeadBucket returned: ${err.name} (${err.$metadata?.httpStatusCode}) — trying create anyway`);
    }
  }

  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`✓ Created bucket "${bucket}"`);
  } catch (err: any) {
    if (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists') {
      console.log(`✓ Bucket "${bucket}" already exists`);
      return;
    }
    throw err;
  }
}

async function applyPublicReadPolicy() {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    }),
  );
  console.log(`✓ Applied public-read policy to "${bucket}"`);
}

async function main() {
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Bucket:   ${bucket}`);
  console.log(`Region:   ${region}\n`);

  await ensureBucket();
  await applyPublicReadPolicy();

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Setup failed:', err.name ?? 'Error', '—', err.message ?? err);
  process.exit(1);
});
