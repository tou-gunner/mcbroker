import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { FaArrowDown, FaBuilding, FaChevronRight } from 'react-icons/fa6';
import { Link } from '@/i18n/routing';
import type { CompanyResponse } from '@/app/interfaces/company';
import { CATEGORY_SLUGS } from '@/app/utils/catalog';
import AssetImage from '../../components/ui/AssetImage';
import Button from '../../components/ui/Button';
import CtaBand from '../../components/CtaBand';
import MobileAdvisorBar from '../../components/MobileAdvisorBar';
import { CompanyContactRegistration } from '../../components/PublicSiteProvider';
import ProductCatalog, { type ProductCardData } from './ProductCatalog';
import ProductSkeleton from './ProductSkeleton';

export type CompanyProfileData = Pick<CompanyResponse, 'name' | 'description' | 'logo' | 'available_insurances'>;

export default async function CompanyProfile({ company, products, loadFailed = false }: {
  company: CompanyProfileData;
  products: ProductCardData[];
  loadFailed?: boolean;
}) {
  const t = await getTranslations('company');
  const nav = await getTranslations('navigation');
  const categories = await getTranslations('categories.items');
  const name = company.name.trim() || t('unnamed');
  const offered = CATEGORY_SLUGS.filter(category => company.available_insurances.includes(category));

  return <div className="company-page">
    <CompanyContactRegistration name={name} />
    <div className="site-container">
      <nav className="company-breadcrumbs" aria-label={t('breadcrumbs')}><ol>
        <li><Link href="/">{nav('home')}</Link></li>
        <li><FaChevronRight aria-hidden="true" /><Link href="/#company-list">{nav('companies')}</Link></li>
        <li><FaChevronRight aria-hidden="true" /><span aria-current="page">{name}</span></li>
      </ol></nav>
      <section className="company-intro" aria-labelledby="company-title">
        <AssetImage src={company.logo} alt="" sizes="160px" className="company-logo" fallback={<FaBuilding />} priority />
        <div className="company-intro-copy">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 id="company-title">{name}</h1>
          {company.description.trim() && <p className="company-description">{company.description}</p>}
          {offered.length > 0 && <ul className="company-categories" aria-label={t('availableCategories')}>{offered.map(category => <li key={category}>{categories(category)}</li>)}</ul>}
          <div className="company-actions"><Button href="#company-products">{t('browseProducts')}<FaArrowDown aria-hidden="true" /></Button><Button href="#contact" variant="secondary">{nav('contact')}</Button></div>
        </div>
      </section>
    </div>
    <Suspense fallback={<ProductSkeleton />}><ProductCatalog products={products} offeredCategories={offered} loadFailed={loadFailed} /></Suspense>
    <CtaBand />
    <MobileAdvisorBar />
  </div>;
}
