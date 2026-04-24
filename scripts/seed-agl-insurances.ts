import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type ScrapedCompany = {
  slug: string;
  source_url: string;
  name_en: string;
  description_en: string;
};

type ScrapedProduct = {
  page_id: number;
  source_url: string;
  category_slug: string;
  name_en: string;
  description_en: string;
};

type ScrapeOutput = {
  company: ScrapedCompany;
  products: ScrapedProduct[];
};

const JSON_PATH = resolve(__dirname, 'scrape/out/agl.json');

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  const raw = readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(raw) as ScrapeOutput;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    // 1. Resolve the Allianz company by slug.
    const company = await prisma.company.findUnique({
      where: { slug: data.company.slug },
    });
    if (!company) {
      throw new Error(
        `Company slug "${data.company.slug}" not found. Run fix-allianz-slug.ts first.`,
      );
    }
    console.log(`Company: ${data.company.name_en}  id=${company.id}`);

    // 2. Refresh company metadata (en + lo; lo copies en per plan).
    for (const [locale, key, value] of [
      ['en', 'name',        data.company.name_en],
      ['en', 'description', data.company.description_en],
      ['lo', 'name',        data.company.name_en],
      ['lo', 'description', data.company.description_en],
    ] as const) {
      await prisma.companyMetadata.upsert({
        where: {
          companyId_locale_key: { companyId: company.id, locale, key },
        },
        create: { companyId: company.id, locale, key, value },
        update: { value },
      });
    }
    console.log('  ↻ refreshed company metadata (en + lo)');

    // 3. Build a slug → categoryId map so we don't hit the DB per product.
    const categories = await prisma.insuranceCategory.findMany({
      select: { id: true, slug: true },
    });
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
    const missing = new Set<string>();
    for (const p of data.products) {
      if (!categoryBySlug.has(p.category_slug)) missing.add(p.category_slug);
    }
    if (missing.size) {
      throw new Error(
        `Missing categories: ${[...missing].join(', ')}. Run seed-insurance-categories.ts first.`,
      );
    }

    // 4. Upsert each insurance by deterministic slug.
    let created = 0;
    let updated = 0;
    for (const p of data.products) {
      const categoryId = categoryBySlug.get(p.category_slug)!;
      const insSlug = `allianz-${slugify(p.name_en)}`;

      const existing = await prisma.insurance.findUnique({ where: { slug: insSlug } });

      if (existing) {
        // Update: leave `status` alone so admins can archive without us undoing it.
        await prisma.insurance.update({
          where: { id: existing.id },
          data: { categoryId, companyId: company.id },
        });
        updated++;
      } else {
        await prisma.insurance.create({
          data: {
            slug: insSlug,
            categoryId,
            companyId: company.id,
            status: 'PUBLISHED',
            featured: false,
            priority: 0,
          },
        });
        created++;
      }

      const insurance = await prisma.insurance.findUnique({ where: { slug: insSlug } });
      if (!insurance) throw new Error(`Failed to upsert insurance slug=${insSlug}`);

      // Metadata: en has scraped values; lo copies en verbatim per plan.
      for (const [locale, key, value] of [
        ['en', 'name',        p.name_en],
        ['en', 'description', p.description_en],
        ['lo', 'name',        p.name_en],
        ['lo', 'description', p.description_en],
      ] as const) {
        await prisma.insuranceMetadata.upsert({
          where: {
            insuranceId_locale_key: { insuranceId: insurance.id, locale, key },
          },
          create: { insuranceId: insurance.id, locale, key, value },
          update: { value },
        });
      }

      console.log(
        `${existing ? '↻' : '+'} [${p.category_slug.padEnd(8)}] ${p.name_en.padEnd(42)} slug=${insSlug}`,
      );
    }

    console.log(
      `\nDone. created=${created}  updated=${updated}  total=${data.products.length}`,
    );
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
