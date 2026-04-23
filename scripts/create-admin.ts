import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;
const MIN_LENGTH = 8;

async function main() {
  const [, , rawEmail, password, name] = process.argv;

  if (!rawEmail || !password) {
    console.error('Usage: pnpm exec tsx scripts/create-admin.ts <email> <password> [name]');
    process.exit(1);
  }
  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const email = rawEmail.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Invalid email: ${rawEmail}`);
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const displayName = name ?? email.split('@')[0];

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.admin.update({
        where: { email },
        data: { passwordHash, name: name ?? existing.name },
      });
      console.log(`✓ Updated admin ${updated.email} (id=${updated.id})`);
    } else {
      const created = await prisma.admin.create({
        data: { email, passwordHash, name: displayName },
      });
      console.log(`✓ Created admin ${created.email} (id=${created.id})`);
    }
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
