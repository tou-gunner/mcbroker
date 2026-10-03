import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getInsuranceById } from '@/app/services/insurance-detail';
import InsuranceDetail from './InsuranceDetail';

type Props = { params: Promise<{ id: string; locale: string }> };
const loadInsurance = cache(getInsuranceById);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'insurance' });
  const company = await getTranslations({ locale, namespace: 'company' });
  // Keep temporary service failures in the page's error boundary.
  const insurance = await loadInsurance(id, locale).catch(() => null);
  return {
    title: `${insurance ? insurance.name.trim() || company('unnamedProduct') : t(insurance === null ? 'errorTitle' : 'unavailableTitle')} | MC Broker`,
    description: insurance?.description.trim() || t('metaDescription'),
  };
}

export default async function InsurancePage({ params }: Props) {
  const { id, locale } = await params;
  const insurance = await loadInsurance(id, locale);
  if (!insurance) notFound();
  return <InsuranceDetail insurance={insurance} />;
}
