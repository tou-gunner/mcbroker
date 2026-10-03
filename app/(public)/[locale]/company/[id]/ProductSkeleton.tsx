import { getTranslations } from 'next-intl/server';

export default async function ProductSkeleton() {
  const t = await getTranslations('company');
  return <div className="site-section company-products-section" role="status">
    <div className="site-container"><span className="sr-only">{t('loadingProducts')}</span>
      <div className="insurer-grid" aria-hidden="true">{[0, 1, 2].map(index => <div className="skeleton-card product-skeleton" key={index}><div /><span /><span /></div>)}</div>
    </div>
  </div>;
}
