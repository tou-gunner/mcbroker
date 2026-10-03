import { getTranslations } from 'next-intl/server';
import ProductSkeleton from './ProductSkeleton';

export default async function CompanyLoading() {
  const t = await getTranslations('company');
  return <div className="company-page">
    <div className="site-container company-loading" role="status"><span className="sr-only">{t('loadingCompany')}</span><div className="skeleton-card" aria-hidden="true"><div /><span /><span /></div></div>
    <ProductSkeleton />
  </div>;
}
