import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { generateJSON } from '@tiptap/html/server';
import { s3, S3_BUCKET, publicUrl } from '../app/lib/s3';
import { richTextExtensions } from '../app/lib/rich-text-extensions';

type ScrapedProduct = {
  page_id: number;
  source_url: string;
  category_slug: string;
  name_en: string;
  description_en: string;
  thumbnail_url: string | null;
  content: {
    html: string;
    text: string;
    inline_images: string[];
    pdf_links: { href: string; text: string }[];
  };
};

type ScrapeOutput = {
  company: { slug: string };
  products: ScrapedProduct[];
};

const JSON_PATH = resolve(__dirname, 'scrape/out/agl.json');

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// AGL's WAF 503s on bare UAs — same treatment as Phase 2 thumbnails seed.
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const REFERER = 'https://www.agl.com.la/';

// MIME → ext. Extends s3.ts's image-only map with PDF for body downloads.
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};
const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

function sanitizeBasename(raw: string): string {
  const name = raw.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  // Truncate base (keep extension) to 80 chars total.
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return name.slice(0, 80);
  const base = name.slice(0, dot);
  const ext = name.slice(dot);
  const maxBase = Math.max(1, 80 - ext.length);
  return base.slice(0, maxBase) + ext;
}

async function downloadAsset(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Referer: REFERER,
      Accept:
        'text/html,application/xhtml+xml,application/pdf,image/avif,image/webp,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);

  let contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!MIME_TO_EXT[contentType]) {
    // Fallback: infer from URL extension when server sends application/octet-stream
    // or similar generic Content-Type.
    const ext = extname(new URL(url).pathname).toLowerCase().replace(/^\./, '');
    const guessed = EXT_TO_MIME[ext];
    if (guessed) contentType = guessed;
    else throw new Error(`unsupported content-type=${contentType} ext=${ext} url=${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

async function rehostAsset(
  url: string,
  insuranceId: string,
  seenKeys: Set<string>,
): Promise<{ url: string } | null> {
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith('agl.com.la')) {
    console.log(`    ? non-AGL url, leaving as-is: ${url}`);
    return null;
  }

  const rawName =
    decodeURIComponent(parsed.pathname.split('/').pop() || 'asset') || 'asset';
  let sanitized = sanitizeBasename(rawName);
  // If two different URLs collide on the sanitised basename within this
  // product, append a 6-char hash of the full URL.
  let key = `insurances/${insuranceId}/body/${sanitized}`;
  if (seenKeys.has(key)) {
    const hash = createHash('sha1').update(url).digest('hex').slice(0, 6);
    const dot = sanitized.lastIndexOf('.');
    sanitized =
      dot > 0
        ? sanitized.slice(0, dot) + '-' + hash + sanitized.slice(dot)
        : sanitized + '-' + hash;
    key = `insurances/${insuranceId}/body/${sanitized}`;
  }
  seenKeys.add(key);

  // Always download+PUT. Re-uploads with the same key are idempotent (MinIO
  // overwrites) so there's no point HEAD-checking first; the S3 wire format
  // for HEAD 404 differs across implementations and has been unreliable here.
  const { buffer, contentType } = await downloadAsset(url);
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return { url: publicUrl(key) };
}

async function main() {
  const force = process.argv.includes('--force');
  const raw = readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(raw) as ScrapeOutput;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let mediaUploaded = 0;
  let mediaFailed = 0;

  try {
    const company = await prisma.company.findUnique({
      where: { slug: data.company.slug },
    });
    if (!company) throw new Error(`Company slug "${data.company.slug}" not found.`);
    console.log(`Company: ${data.company.slug}  id=${company.id}`);

    for (const p of data.products) {
      if (!p.content?.html) {
        console.log(`- [${p.category_slug.padEnd(8)}] ${p.name_en}  (no content, skip)`);
        skipped++;
        continue;
      }

      const insSlug = `allianz-${slugify(p.name_en)}`;
      const insurance = await prisma.insurance.findUnique({
        where: { slug: insSlug },
        select: { id: true },
      });
      if (!insurance) {
        console.log(`- [${p.category_slug.padEnd(8)}] ${p.name_en}  (no insurance row slug=${insSlug})`);
        skipped++;
        continue;
      }

      try {
        // Re-host all body media (images + PDFs) to our S3.
        const urlMap = new Map<string, string>();
        const keysInUse = new Set<string>();
        const assetUrls = new Set<string>([
          ...p.content.inline_images,
          ...p.content.pdf_links.map((l) => l.href),
        ]);
        for (const url of assetUrls) {
          try {
            const r = await rehostAsset(url, insurance.id, keysInUse);
            if (r) {
              urlMap.set(url, r.url);
              mediaUploaded++;
            }
          } catch (err) {
            mediaFailed++;
            console.warn(
              `    ! ${url}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        // Rewrite HTML: replace each AGL URL with our publicUrl.
        let rewrittenHtml = p.content.html;
        for (const [oldUrl, newUrl] of urlMap) {
          rewrittenHtml = rewrittenHtml.split(oldUrl).join(newUrl);
        }

        // Skip if stored HTML already matches what we'd write (clean re-run)
        // OR differs from our output (admin-modified; don't clobber). Either
        // way, --force overrides.
        const existingEn = await prisma.insuranceContent.findUnique({
          where: {
            insuranceId_locale: { insuranceId: insurance.id, locale: 'en' },
          },
        });
        if (!force && existingEn && existingEn.contentHtml) {
          const matches = existingEn.contentHtml === rewrittenHtml;
          const reason = matches ? 'already up to date' : 'admin-modified';
          console.log(
            `↻ [${p.category_slug.padEnd(8)}] ${p.name_en}  (${reason}${matches ? '' : '; pass --force to overwrite'})`,
          );
          skipped++;
          continue;
        }

        // HTML → ProseMirror JSON using the admin editor's extension list.
        const contentJson = generateJSON(rewrittenHtml, richTextExtensions) as any;

        // images[] holds all re-hosted media URLs so orphans.ts doesn't delete
        // PDFs (which otherwise only live inside contentHtml as <a href> and
        // aren't caught by its <img>-only walker).
        const rehostedUrls = Array.from(urlMap.values());

        for (const locale of ['en', 'lo'] as const) {
          await prisma.insuranceContent.upsert({
            where: {
              insuranceId_locale: { insuranceId: insurance.id, locale },
            },
            create: {
              insuranceId: insurance.id,
              locale,
              contentJson,
              contentHtml: rewrittenHtml,
              contentText: p.content.text,
              images: rehostedUrls,
              isPublished: false,
            },
            update: {
              contentJson,
              contentHtml: rewrittenHtml,
              contentText: p.content.text,
              images: rehostedUrls,
              isPublished: false,
            },
          });
        }

        if (existingEn) updated++;
        else created++;
        console.log(
          `${existingEn ? '↻' : '+'} [${p.category_slug.padEnd(8)}] ${p.name_en.padEnd(42)} media=${urlMap.size}/${assetUrls.size}`,
        );
      } catch (err) {
        console.error(
          `x [${p.category_slug.padEnd(8)}] ${p.name_en}: ${err instanceof Error ? err.message : String(err)}`,
        );
        errors++;
      }
    }

    console.log(
      `\nDone. created=${created}  updated=${updated}  skipped=${skipped}  errors=${errors}  media_uploaded=${mediaUploaded}  media_failed=${mediaFailed}  total=${data.products.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }

  if (errors > 0) process.exit(1);
}

main();
