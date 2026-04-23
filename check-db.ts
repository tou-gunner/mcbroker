import { PrismaClient } from './app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...\n');

    const companies = await prisma.company.findMany();
    console.log(`📦 Companies: ${companies.length} records`);

    const categories = await prisma.insuranceCategory.findMany();
    console.log(`📁 Categories: ${categories.length} records`);

    const insurances = await prisma.insurance.findMany();
    console.log(`🏥 Insurances: ${insurances.length} records`);

    const tags = await prisma.tag.findMany();
    console.log(`🏷️  Tags: ${tags.length} records`);

    const admins = await prisma.admin.findMany();
    console.log(`👤 Admins: ${admins.length} records`);

    console.log('\n✅ Database is connected and tables exist!');

    if (companies.length === 0 && categories.length === 0 && insurances.length === 0) {
      console.log('⚠️  All tables are EMPTY - you need to add data first.');
      console.log('\n💡 Next steps:');
      console.log('   1. Add companies (insurance providers)');
      console.log('   2. Add categories (health, life, etc.)');
      console.log('   3. Then create insurance products');
    }

  } catch (error) {
    console.error('❌ Database error:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
