import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type SampleCompany = {
  legacyId: string;
  name: string;
  logo: string;
  description: string;
};

const sampleCompanies: SampleCompany[] = [
  { legacyId: '1',  name: 'Allianze',           logo: 'https://s3.mcins.la/mcins/companies/1/logo.jpg',  description: "Leading provider of comprehensive life and accident insurance solutions with over 20 years of experience in the Lao market. Committed to protecting families and individuals with reliable coverage and exceptional customer service." },
  { legacyId: '2',  name: 'AIA',                logo: 'https://s3.mcins.la/mcins/companies/2/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '3',  name: 'Phongsavanh',        logo: 'https://s3.mcins.la/mcins/companies/3/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '4',  name: 'BSH',                logo: 'https://s3.mcins.la/mcins/companies/4/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '5',  name: 'Insee',              logo: 'https://s3.mcins.la/mcins/companies/5/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '6',  name: 'HPC',                logo: 'https://s3.mcins.la/mcins/companies/6/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '7',  name: 'Zhong Ji',           logo: 'https://s3.mcins.la/mcins/companies/7/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '8',  name: 'Laothepchalern',     logo: 'https://s3.mcins.la/mcins/companies/8/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '9',  name: 'Kungthep',           logo: 'https://s3.mcins.la/mcins/companies/9/logo.jpg',  description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '10', name: 'Lao chine pacific',  logo: 'https://s3.mcins.la/mcins/companies/10/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '11', name: 'Lao vivat',          logo: 'https://s3.mcins.la/mcins/companies/11/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '12', name: 'LVI',                logo: 'https://s3.mcins.la/mcins/companies/12/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '13', name: 'MSIG',               logo: 'https://s3.mcins.la/mcins/companies/13/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '14', name: 'Lanxang',            logo: 'https://s3.mcins.la/mcins/companies/14/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '15', name: 'Prudential',         logo: 'https://s3.mcins.la/mcins/companies/15/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '16', name: 'Muanfthai',          logo: 'https://s3.mcins.la/mcins/companies/16/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '17', name: 'Toyota',             logo: 'https://s3.mcins.la/mcins/companies/17/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '18', name: 'TK',                 logo: 'https://s3.mcins.la/mcins/companies/17/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '19', name: 'Thipphaya',          logo: 'https://s3.mcins.la/mcins/companies/19/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '20', name: 'VTI',                logo: 'https://s3.mcins.la/mcins/companies/20/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
  { legacyId: '21', name: 'Sokxay',             logo: 'https://s3.mcins.la/mcins/companies/21/logo.jpg', description: "Trusted insurance partner specializing in health and accident protection. We offer flexible insurance plans tailored to your needs, backed by a nationwide network of healthcare providers and quick claim processing." },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  let created = 0;
  let updated = 0;

  try {
    for (const c of sampleCompanies) {
      const slug = slugify(c.name);

      const existing = await prisma.company.findUnique({ where: { slug } });

      const company = await prisma.company.upsert({
        where: { slug },
        create: { slug, logo: c.logo },
        update: { logo: c.logo },
      });

      if (existing) updated++;
      else created++;

      for (const locale of ['en', 'lo'] as const) {
        for (const [key, value] of [['name', c.name], ['description', c.description]] as const) {
          await prisma.companyMetadata.upsert({
            where: {
              companyId_locale_key: {
                companyId: company.id,
                locale,
                key,
              },
            },
            create: { companyId: company.id, locale, key, value },
            update: { value },
          });
        }
      }

      console.log(`${existing ? '↻' : '+'} ${c.name.padEnd(22)} id=${company.id}  slug=${slug}`);
    }

    console.log(`\nDone. created=${created}  updated=${updated}  total=${sampleCompanies.length}`);
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
