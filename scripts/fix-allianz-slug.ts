import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * One-off: rename the `allianze` (typo) company slug to `allianz`. The company
 * UUID stays the same, so any `/company/<uuid>` URLs keep working. Run
 * `migrate-company-logos-to-slug.ts` after this to move the S3 logo object
 * from `companies/allianze/...` to `companies/allianz/...`.
 *
 * Idempotent — safe to re-run; no-ops once the slug is already `allianz`.
 */
async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const target = await prisma.company.findUnique({ where: { slug: 'allianz' } });
    if (target) {
      console.log(`Already renamed. id=${target.id}  slug=allianz`);
      return;
    }

    const existing = await prisma.company.findUnique({ where: { slug: 'allianze' } });
    if (!existing) {
      console.log('No company with slug=allianze or slug=allianz found. Nothing to do.');
      return;
    }

    const updated = await prisma.company.update({
      where: { id: existing.id },
      data: { slug: 'allianz' },
    });

    console.log(`✓ id=${updated.id}  allianze → allianz`);
    console.log(`  Note: company.logo still points at the old S3 path (${existing.logo}).`);
    console.log("  Run: pnpm exec tsx scripts/migrate-company-logos-to-slug.ts");
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
