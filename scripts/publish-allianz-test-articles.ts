import 'dotenv/config';
import { createHash } from 'node:crypto';
import { prisma } from '../app/lib/prisma';

// One-time development backfill. Explicit scope: the 16 already-seeded Allianz products.
// New products and future seed imports are deliberately not included.
const companyId = '193e673e-2659-43d5-8e7c-5300199c3ab5';
const slugs = [
  'allianz-smart-flex-motor-insurance', 'allianz-worry-free-driving-motor-insurance',
  'allianz-third-party-liability-motor-insurance', 'allianz-health-insurance',
  'allianz-personal-accident', 'allianz-workmen-s-compensation-insurance',
  'allianz-life-protection-insurance', 'allianz-term-life-insurance',
  'allianz-travel-insurance', 'allianz-home-insurance',
  'allianz-small-commercial-business-insurance', 'allianz-property-all-risks',
  'allianz-public-liability-insurance', 'allianz-engineering-machinery-insurance',
  'allianz-money-insurance', 'allianz-transport-insurance',
];
const apply = process.argv.includes('--apply');
if (process.argv.slice(2).some(argument => argument !== '--apply')) throw new Error('Usage: tsx scripts/publish-allianz-test-articles.ts [--apply]');

async function main() {
  const result = await prisma.$transaction(async transaction => {
    const products = await transaction.insurance.findMany({
      where: { slug: { in: slugs }, companyId, status: 'PUBLISHED', company: { slug: 'allianz', isActive: true } },
      select: { id: true, content: { where: { locale: { in: ['en', 'lo'] } }, orderBy: { locale: 'asc' } } },
    });
    if (products.length !== 16 || products.some(product => product.content.length !== 2)) {
      throw new Error('Expected all 16 active, published seeded products and their 32 EN/LO articles. No changes made.');
    }
    const targets = products.flatMap(product => product.content);
    const pending = targets.filter(row => !row.isPublished || !row.publishedAt);
    const ids = new Set(targets.map(row => row.id));
    const before = await transaction.insuranceContent.findMany({ orderBy: { id: 'asc' } });
    // Target content, versions, createdAt/updatedAt, and all out-of-scope rows must be identical.
    const fingerprint = (rows: typeof before) => createHash('sha256').update(JSON.stringify(rows.map(row => {
      if (!ids.has(row.id)) return row;
      return { ...row, isPublished: undefined, publishedAt: undefined };
    }))).digest('hex');
    if (apply) {
      const publishedAt = new Date();
      for (const row of pending) await transaction.insuranceContent.update({
        where: { id: row.id },
        data: { isPublished: true, publishedAt: row.publishedAt ?? publishedAt, updatedAt: row.updatedAt },
      });
      const after = await transaction.insuranceContent.findMany({ orderBy: { id: 'asc' } });
      if (fingerprint(before) !== fingerprint(after)) throw new Error('Content preservation check failed; transaction rolled back.');
      if (after.filter(row => ids.has(row.id)).some(row => !row.isPublished || !row.publishedAt)) throw new Error('Publication verification failed; transaction rolled back.');
      for (const row of targets) {
        if (row.publishedAt && after.find(updated => updated.id === row.id)?.publishedAt?.getTime() !== row.publishedAt.getTime()) throw new Error('Existing publication date changed; transaction rolled back.');
      }
    }
    return { mode: apply ? 'applied' : 'dry-run', products: products.length, articles: targets.length, changed: apply ? pending.length : 0, pending: apply ? 0 : pending.length, preservationVerified: apply };
  }, { isolationLevel: 'Serializable', timeout: 30000 });
  console.log(JSON.stringify(result));
}

main().catch(error => {
  console.error(error instanceof Error && !('code' in error) ? error.message : 'Article publication failed. No changes committed.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
