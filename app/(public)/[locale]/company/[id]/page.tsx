import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCompany, getInsurancesByCompanyId } from '@/app/services';
import CompanyProfile from './CompanyProfile';
import type { ProductCardData } from './ProductCatalog';

type Props = { params: Promise<{ id: string; locale: string }> };
const loadCompany = cache(getCompany);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'company' });
  // Temporary data failures belong to the page's error boundary, not a 404.
  const company = await loadCompany(id, locale).catch(() => null);
  return {
    title: `${company ? company.name.trim() || t('unnamed') : t(company === null ? 'errorTitle' : 'unavailableTitle')} | MC Broker`,
    description: company?.description.trim() || t('metaDescription'),
  };
}

export default async function CompanyPage({ params }: Props) {
  const { id, locale } = await params;
  const company = await loadCompany(id, locale);
  if (!company) notFound();

  let products: ProductCardData[] = [];
  let loadFailed = false;
  try {
    products = await getInsurancesByCompanyId(id, locale);
  } catch {
    console.error('Company products could not be loaded', { companyId: id });
    loadFailed = true;
  }
  return <CompanyProfile company={company} products={products} loadFailed={loadFailed} />;
}
