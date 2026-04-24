import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { copyObject, deleteObjects, keyFromPublicUrl, publicUrl } from '../app/lib/s3';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const companies = await prisma.company.findMany({
      select: { id: true, slug: true, logo: true },
    });

    for (const c of companies) {
      if (!c.logo) {
        skipped++;
        continue;
      }

      const currentKey = keyFromPublicUrl(c.logo);
      if (!currentKey) {
        console.log(`- ${c.slug.padEnd(22)} external URL, skipped (${c.logo})`);
        skipped++;
        continue;
      }

      if (!currentKey.startsWith('companies/')) {
        console.log(`- ${c.slug.padEnd(22)} unexpected prefix, skipped (${currentKey})`);
        skipped++;
        continue;
      }

      const ext = currentKey.split('.').pop() ?? 'jpg';
      const targetKey = `companies/${c.slug}/logo.${ext}`;

      if (currentKey === targetKey) {
        skipped++;
        continue;
      }

      try {
        if (dryRun) {
          console.log(`→ ${c.slug.padEnd(22)} ${currentKey}  →  ${targetKey}  (dry-run)`);
        } else {
          await copyObject(currentKey, targetKey);
          await prisma.company.update({
            where: { id: c.id },
            data: { logo: publicUrl(targetKey) },
          });
          await deleteObjects([currentKey]);
          console.log(`✓ ${c.slug.padEnd(22)} ${currentKey}  →  ${targetKey}`);
        }
        migrated++;
      } catch (err) {
        console.error(
          `✗ ${c.slug.padEnd(22)} ${currentKey}: ${err instanceof Error ? err.message : String(err)}`,
        );
        errors++;
      }
    }

    const mode = dryRun ? ' (dry-run)' : '';
    console.log(
      `\nDone${mode}. migrated=${migrated}  skipped=${skipped}  errors=${errors}  total=${companies.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }

  if (errors > 0) process.exit(1);
}

main();
