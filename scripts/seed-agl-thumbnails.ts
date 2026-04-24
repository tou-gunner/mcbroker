import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  s3,
  S3_BUCKET,
  publicUrl,
  ALLOWED_IMAGE_TYPES,
  extForMime,
} from '../app/lib/s3';

type ScrapedProduct = {
  page_id: number;
  source_url: string;
  category_slug: string;
  name_en: string;
  description_en: string;
  thumbnail_url: string | null;
};

type ScrapeOutput = {
  company: { slug: string };
  products: ScrapedProduct[];
};

const JSON_PATH = resolve(__dirname, 'scrape/out/agl.json');

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// AGL's WAF 503s on bare UAs — same treatment as the Python scraper.
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const REFERER = 'https://www.agl.com.la/';

async function downloadImage(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Referer: REFERER,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  let contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    // AGL sometimes sends generic `application/octet-stream`; fall back to the
    // extension in the URL.
    const ext = extname(new URL(url).pathname).toLowerCase().replace(/^\./, '');
    const extToMime: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };
    const guessed = extToMime[ext];
    if (guessed) contentType = guessed;
    else throw new Error(`unsupported content-type=${contentType} ext=${ext} url=${url}`);
  }
  const arr = new Uint8Array(await res.arrayBuffer());
  return { buffer: Buffer.from(arr), contentType };
}

async function main() {
  const force = process.argv.includes('--force');

  const raw = readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(raw) as ScrapeOutput;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const company = await prisma.company.findUnique({ where: { slug: data.company.slug } });
    if (!company) throw new Error(`Company slug "${data.company.slug}" not found.`);

    for (const p of data.products) {
      if (!p.thumbnail_url) {
        console.log(`- [${p.category_slug.padEnd(8)}] ${p.name_en}  (no thumbnail_url in scrape, skipping)`);
        skipped++;
        continue;
      }

      const insSlug = `allianz-${slugify(p.name_en)}`;
      const insurance = await prisma.insurance.findUnique({
        where: { slug: insSlug },
        select: { id: true, thumbnail: true },
      });
      if (!insurance) {
        console.log(`- [${p.category_slug.padEnd(8)}] ${p.name_en}  (no insurance row for slug=${insSlug})`);
        skipped++;
        continue;
      }

      if (insurance.thumbnail && !force) {
        console.log(`↻ [${p.category_slug.padEnd(8)}] ${p.name_en}  (already has thumbnail, pass --force to overwrite)`);
        skipped++;
        continue;
      }

      try {
        const { buffer, contentType } = await downloadImage(p.thumbnail_url);
        const ext = extForMime(contentType);
        if (!ext) throw new Error(`no extension mapping for ${contentType}`);

        const key = `insurances/${insurance.id}/thumbnail.${ext}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          }),
        );

        const url = publicUrl(key);
        await prisma.insurance.update({
          where: { id: insurance.id },
          data: { thumbnail: url },
        });

        console.log(`+ [${p.category_slug.padEnd(8)}] ${p.name_en.padEnd(42)} -> ${key}  (${buffer.byteLength} bytes)`);
        uploaded++;
      } catch (err) {
        console.error(
          `x [${p.category_slug.padEnd(8)}] ${p.name_en}: ${err instanceof Error ? err.message : String(err)}`,
        );
        errors++;
      }
    }

    console.log(`\nDone. uploaded=${uploaded}  skipped=${skipped}  errors=${errors}  total=${data.products.length}`);
  } finally {
    await prisma.$disconnect();
  }

  if (errors > 0) process.exit(1);
}

main();
