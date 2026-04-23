import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const region = process.env.S3_REGION ?? 'us-east-1';

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  console.error('Missing S3 env vars (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY)');
  process.exit(1);
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const ROOT = process.cwd();

type Asset = { from: string; to: string };

const assets: Asset[] = [
  // 21 company logos (1.jpg through 21.jpg)
  ...Array.from({ length: 21 }, (_, i) => ({
    from: `public/logo/${i + 1}.jpg`,
    to: `companies/${i + 1}/logo.jpg`,
  })),
  // Site logo
  { from: 'public/logo/logo.png', to: 'site/logo.png' },
  // Banners
  { from: 'public/banners/banner-bg.jpg', to: 'banners/banner-bg.jpg' },
  { from: 'public/banners/ins-banner1.jpg', to: 'banners/ins-banner1.jpg' },
  { from: 'public/banners/ins-banner2.jpg', to: 'banners/ins-banner2.jpg' },
];

async function uploadOne({ from, to }: Asset) {
  const abs = path.join(ROOT, from);
  const body = await readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const contentType = MIME[ext] ?? 'application/octet-stream';

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: to,
      Body: body,
      ContentType: contentType,
    }),
  );
  console.log(`  ✓ ${from}  →  ${to} (${body.length} bytes, ${contentType})`);
}

async function main() {
  console.log(`Uploading ${assets.length} assets to s3://${bucket}/`);
  console.log(`Endpoint: ${endpoint}\n`);

  let ok = 0;
  let failed = 0;
  for (const asset of assets) {
    try {
      await uploadOne(asset);
      ok++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${asset.from}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
