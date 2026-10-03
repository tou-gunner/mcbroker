"use client";
import { useTranslations } from 'next-intl';
import { FaArrowRight, FaBuilding, FaMagnifyingGlass, FaRotateRight } from 'react-icons/fa6';
import { Link } from '@/i18n/routing';
import { useAppContext } from '@/app/contexts';
import { CATEGORY_SLUGS, type CategorySlug } from '@/app/utils/catalog';
import type { CompanyResponse } from '@/app/interfaces/company';
import Section from './ui/Section';
import AssetImage from './ui/AssetImage';
import Button from './ui/Button';

export function CatalogSkeleton() {
  const t = useTranslations('companies');
  return <div className="catalog-skeleton" role="status"><span className="sr-only">{t('loading')}</span><div className="insurer-grid" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="skeleton-card"><div /><span /><span /></div>)}</div></div>;
}

export default function CompanyListSection() {
  const t = useTranslations('companies');
  const categories = useTranslations('categories.items');
  const { companies, filteredCompanies, selectedFilter, query, status, setSelectedFilter, setQuery, clearFilters, retry } = useAppContext();
  const hasFilters = selectedFilter !== 'all' || query.length > 0;
  return <Section id="company-list" eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} className="directory-section">
    <div className="directory-toolbar">
      <div className="search-field"><label htmlFor="insurer-search">{t('searchLabel')}</label><div className="search-input"><FaMagnifyingGlass aria-hidden="true" /><input id="insurer-search" type="search" value={query} placeholder={t('searchPlaceholder')} onChange={event => setQuery(event.target.value)} /></div></div>
      <fieldset className="filter-field"><legend>{t('filterLabel')}</legend><div className="filter-list">
        {(['all', ...CATEGORY_SLUGS] as const).map(slug => <button key={slug} type="button" className="filter-chip" aria-pressed={selectedFilter === slug} onClick={() => setSelectedFilter(slug)}>{slug === 'all' ? t('all') : categories(slug)}</button>)}
      </div></fieldset>
    </div>
    <div className="directory-meta"><p role="status" aria-live="polite" aria-atomic="true">{status === 'ready' ? t('results', { count: filteredCompanies.length }) : status === 'loading' ? t('loading') : t('errorTitle')}</p>{hasFilters && <button type="button" className="text-button" onClick={clearFilters}>{t('clear')}</button>}</div>
    {status === 'loading' && <CatalogSkeleton />}
    {status === 'error' && <div className="catalog-state" role="alert"><FaRotateRight aria-hidden="true" /><h3>{t('errorTitle')}</h3><p>{t('errorBody')}</p><Button onClick={retry}>{t('retry')}</Button></div>}
    {status === 'ready' && filteredCompanies.length > 0 && <div className="insurer-grid">{filteredCompanies.map(company => <CompanyCard key={company.id} company={company} />)}</div>}
    {status === 'ready' && filteredCompanies.length === 0 && <div className="catalog-state"><FaMagnifyingGlass aria-hidden="true" /><h3>{t(companies.length ? 'noMatches' : 'emptyTitle')}</h3><p>{companies.length ? t('noMatchesBody', { query: query.trim() || '—', category: selectedFilter === 'all' ? t('all') : categories(selectedFilter) }) : t('emptyBody')}</p>{companies.length ? <Button variant="secondary" onClick={clearFilters}>{t('clear')}</Button> : <Button href="#contact">{t('askAdvisor')}</Button>}</div>}
  </Section>;
}

function CompanyCard({ company }: { company: CompanyResponse }) {
  const t = useTranslations('companies');
  const categories = useTranslations('categories.items');
  const { selectedFilter } = useAppContext();
  const slugs = company.available_insurances.filter((slug): slug is CategorySlug => CATEGORY_SLUGS.includes(slug as CategorySlug));
  return <Link href={`/company/${company.id}${selectedFilter === 'all' ? '' : `?category=${selectedFilter}`}`} className="insurer-card" prefetch={false}>
    <div className="insurer-card-top"><AssetImage src={company.logo} alt="" sizes="112px" className="insurer-logo" fallback={<FaBuilding />} /><span className="card-arrow" aria-hidden="true"><FaArrowRight /></span></div>
    <h3>{company.name || t('unnamed')}</h3>
    {company.description && <p className="insurer-description">{company.description}</p>}
    <div className="insurer-categories">{slugs.map(slug => <span key={slug}>{categories(slug)}</span>)}</div>
    <span className="card-link">{t('viewPlans')}<FaArrowRight aria-hidden="true" /></span>
  </Link>;
}
