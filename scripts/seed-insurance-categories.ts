import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type Category = {
  slug: string;
  name_en: string;
  name_lo: string;
};

// Canonical slugs the frontend renders icons for in app/utils/index.ts.
// Keep this list in sync with getInsuranceLogo's map.
const categories: Category[] = [
  { slug: 'life',     name_en: 'Life',              name_lo: 'ປະກັນໄພຊີວິດ' },
  { slug: 'health',   name_en: 'Health',            name_lo: 'ປະກັນໄພສຸຂະພາບ' },
  { slug: 'accident', name_en: 'Accident',          name_lo: 'ປະກັນໄພອຸປະຕິເຫດ' },
  { slug: 'travel',   name_en: 'Travel',            name_lo: 'ປະກັນໄພການເດີນທາງ' },
  { slug: 'home',     name_en: 'Home',              name_lo: 'ປະກັນໄພທີ່ຢູ່ອາໄສ' },
  { slug: 'car',      name_en: 'Motor',             name_lo: 'ປະກັນໄພລົດ' },
  { slug: 'business', name_en: 'Business',          name_lo: 'ປະກັນໄພທຸລະກິດ' },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  let created = 0;
  let updated = 0;

  try {
    for (const c of categories) {
      const existing = await prisma.insuranceCategory.findUnique({ where: { slug: c.slug } });

      const cat = await prisma.insuranceCategory.upsert({
        where: { slug: c.slug },
        create: { slug: c.slug },
        update: {},
      });

      if (existing) updated++;
      else created++;

      for (const [locale, value] of [['en', c.name_en], ['lo', c.name_lo]] as const) {
        await prisma.insuranceCategoryMetadata.upsert({
          where: {
            categoryId_locale_key: {
              categoryId: cat.id,
              locale,
              key: 'name',
            },
          },
          create: { categoryId: cat.id, locale, key: 'name', value },
          update: { value },
        });
      }

      console.log(`${existing ? '↻' : '+'} ${c.slug.padEnd(10)} ${c.name_en}`);
    }

    console.log(`\nDone. created=${created}  updated=${updated}  total=${categories.length}`);
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
