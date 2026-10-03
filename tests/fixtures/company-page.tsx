// Copy into an isolated preview's localized routes only; never into the deployed app.
import { cookies } from 'next/headers';
import CompanyProfile from '@/app/(public)/[locale]/company/[id]/CompanyProfile';

export default async function CompanyFixture({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { locale } = await params;
  const { scenario } = await searchParams;
  const ready = (await cookies()).get('company-fixture-ready')?.value === 'yes';
  if (scenario === 'profile-error' && !ready) throw new Error('Intentional preview fixture failure');
  if (scenario === 'loading') await new Promise(resolve => setTimeout(resolve, 2500));
  const longName = locale === 'lo'
    ? 'ບໍລິສັດປະກັນໄພສຳລັບຄອບຄົວ ແລະ ການຄຸ້ມຄອງທຸລະກິດຂອງທ່ານ'
    : 'InsuranceForEveryStageOfYourFamilyAndBusinessLife';
  const company = {
    name: scenario === 'long' ? longName : scenario === 'missing' ? '' : 'Example Insurance',
    description: scenario === 'missing' ? '' : 'Explore options for your family, home, and everyday journeys.\nAsk an advisor about the details that matter to you.',
    logo: 'https://s3.mcins.la/mcins/missing-company-fixture.webp',
    available_insurances: ['health', 'car', 'home'],
  };
  const products = [
    { id: 'health-one', name: 'Family Health', category: 'health', description: 'Explore health cover for everyday life.', thumbnail: 'https://s3.mcins.la/mcins/missing-product-fixture.webp' },
    { id: 'car-one', name: 'Family Vehicle', category: 'car', description: 'Explore options for your next journey.' },
    { id: 'home-one', name: 'Home Care', category: 'home', description: 'Explore options for your home and belongings.' },
  ].map((product, index) => index === 0 ? {
    ...product,
    name: scenario === 'long' ? longName : scenario === 'missing' ? '' : product.name,
    description: scenario === 'missing' ? '' : product.description,
    category: scenario === 'missing' ? 'unknown-category' : product.category,
  } : product);
  return <CompanyProfile company={company} products={scenario === 'empty' ? [] : products} loadFailed={scenario === 'products-error' && !ready} />;
}
