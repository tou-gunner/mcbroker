"use client";

import { useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FaArrowRight, FaMagnifyingGlass, FaRotateRight, FaShieldHeart } from 'react-icons/fa6';
import { Link, useRouter } from '@/i18n/routing';
import type { InsuranceResponse } from '@/app/interfaces/insurance';
import { CATEGORY_SLUGS, categoryFilter, normalizeSearch, type CategorySlug, type CategoryFilter } from '@/app/utils/catalog';
import AssetImage from '../../components/ui/AssetImage';
import CategoryIcon from '../../components/ui/CategoryIcon';
import Section from '../../components/ui/Section';
import Button from '../../components/ui/Button';

export type ProductCardData = Pick<InsuranceResponse, 'id' | 'name' | 'description' | 'category' | 'thumbnail'>;

export default function ProductCatalog({ products, offeredCategories, loadFailed = false }: {
  products: ProductCardData[];
  offeredCategories: CategorySlug[];
  loadFailed?: boolean;
}) {
  const t = useTranslations('company');
  const categories = useTranslations('categories.items');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const available = loadFailed ? offeredCategories : CATEGORY_SLUGS.filter(category => products.some(product => product.category === category));
  const requestedCategory = categoryFilter(searchParams.get('category'));
  const selected = requestedCategory !== 'all' && available.includes(requestedCategory) ? requestedCategory : 'all';
  const query = searchParams.get('q') ?? '';
  const needle = normalizeSearch(query);
  const filtered = products.filter(product => (selected === 'all' || product.category === selected) && normalizeSearch(product.name.trim() || t('unnamedProduct')).includes(needle));
  const hasFilters = Boolean(query || searchParams.get('category'));

  function updateFilters(changes: { q?: string; category?: CategoryFilter }, replace = false) {
    const url = new URL(window.location.href);
    if (selected === 'all') url.searchParams.delete('category');
    if (changes.category !== undefined) {
      if (changes.category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', changes.category);
    }
    if (changes.q !== undefined) {
      if (changes.q) url.searchParams.set('q', changes.q);
      else url.searchParams.delete('q');
    }
    window.history[replace ? 'replaceState' : 'pushState'](null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  const clear = () => updateFilters({ q: '', category: 'all' });

  return <Section id="company-products" eyebrow={t('productsEyebrow')} title={t('productsTitle')} subtitle={t('productsSubtitle')} className="company-products-section">
    {(products.length > 0 || loadFailed) && <>
      <div className="directory-toolbar">
        <div className="search-field"><label htmlFor="product-search">{t('searchLabel')}</label><div className="search-input"><FaMagnifyingGlass aria-hidden="true" /><input id="product-search" type="search" value={query} placeholder={t('searchPlaceholder')} onChange={event => updateFilters({ q: event.target.value }, true)} /></div></div>
        <fieldset className="filter-field"><legend>{t('filterLabel')}</legend><div className="filter-list">
          {(['all', ...available] as const).map(category => <button key={category} type="button" className="filter-chip" aria-pressed={selected === category} onClick={() => updateFilters({ category })}>{category === 'all' ? t('all') : categories(category)}</button>)}
        </div></fieldset>
      </div>
      <div className="directory-meta"><p role="status" aria-live="polite" aria-atomic="true">{loadFailed ? t(pending ? 'loadingProducts' : 'productsErrorTitle') : t('results', { count: filtered.length })}</p>{hasFilters && <button type="button" className="text-button" onClick={clear}>{t('clear')}</button>}</div>
    </>}
    {loadFailed ? <div className="catalog-state" role="alert" aria-busy={pending}><FaRotateRight aria-hidden="true" /><h3>{t('productsErrorTitle')}</h3><p>{t('productsErrorBody')}</p><Button disabled={pending} onClick={() => startTransition(() => router.refresh())}>{t(pending ? 'loadingProducts' : 'retry')}</Button></div>
      : products.length === 0 ? <div className="catalog-state"><FaShieldHeart aria-hidden="true" /><h3>{t('emptyTitle')}</h3><p>{t('emptyBody')}</p><div className="catalog-state-actions"><Button href="/#company-list">{t('backToDirectory')}</Button><Button href="#contact" variant="secondary">{t('askAdvisor')}</Button></div></div>
      : filtered.length === 0 ? <div className="catalog-state"><FaMagnifyingGlass aria-hidden="true" /><h3>{t('noMatchesTitle')}</h3><p>{t('noMatchesBody', { query: query.trim() || '—', category: selected === 'all' ? t('all') : categories(selected) })}</p><Button variant="secondary" onClick={clear}>{t('clear')}</Button></div>
      : <div className="insurer-grid product-grid">{filtered.map(product => <ProductCard product={product} key={product.id} />)}</div>}
  </Section>;
}

function ProductCard({ product }: { product: ProductCardData }) {
  const t = useTranslations('company');
  const categories = useTranslations('categories.items');
  const category = CATEGORY_SLUGS.find(category => category === product.category);
  return <Link className="product-card" href={`/insurance/${product.id}`} prefetch={false}>
    <AssetImage src={product.thumbnail} alt="" sizes="(min-width: 1280px) 384px, (min-width: 1024px) 31vw, (min-width: 768px) 46vw, 90vw" className="product-image" fallback={category ? <CategoryIcon category={category} /> : <FaShieldHeart />} />
    <div className="product-card-copy"><span className="product-category">{category ? categories(category) : t('otherCategory')}</span>
      <h3>{product.name.trim() || t('unnamedProduct')}</h3>
      {product.description.trim() && <p className="product-description">{product.description}</p>}
      <span className="card-link">{t('viewDetails')}<FaArrowRight aria-hidden="true" /></span>
    </div>
  </Link>;
}
