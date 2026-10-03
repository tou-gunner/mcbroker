import { getTranslations } from 'next-intl/server';

export default async function InsuranceLoading() {
  const t = await getTranslations('insurance');
  return <div className="insurance-page site-container insurance-loading" role="status"><span className="sr-only">{t('loading')}</span>
    <div className="skeleton-card" aria-hidden="true"><div /><span /><span /></div>
    <div className="insurance-layout" aria-hidden="true"><div className="skeleton-card"><span /><span /><span /></div><div className="skeleton-card"><div /><span /></div></div>
  </div>;
}
