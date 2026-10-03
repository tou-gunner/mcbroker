import { getLocale, getTranslations } from 'next-intl/server';
import { FaArrowRight, FaBuilding, FaChevronRight } from 'react-icons/fa6';
import { Link } from '@/i18n/routing';
import type { InsuranceDetail as DetailData } from '@/app/interfaces/insurance-detail';
import AssetImage from '../../components/ui/AssetImage';
import Button from '../../components/ui/Button';
import MobileAdvisorBar from '../../components/MobileAdvisorBar';
import { PageContactRegistration } from '../../components/PublicSiteProvider';
import InsuranceArticle from './InsuranceArticle';
import InsuranceContactPanel from './InsuranceContactPanel';

export default async function InsuranceDetail({ insurance }: { insurance: DetailData }) {
  const locale = await getLocale();
  const t = await getTranslations('insurance');
  const companyText = await getTranslations('company');
  const nav = await getTranslations('navigation');
  const name = insurance.name.trim() || companyText('unnamedProduct');
  const company = insurance.company.trim() || companyText('unnamed');
  const hasContent = Boolean(insurance.contentLocale);
  return <div className="insurance-page">
    <PageContactRegistration companyName={company} productName={name} />
    <div className="site-container">
      <nav className="company-breadcrumbs" aria-label={companyText('breadcrumbs')}><ol>
        <li><Link href="/">{nav('home')}</Link></li>
        <li><FaChevronRight aria-hidden="true" /><Link href={`/company/${insurance.companyId}`}>{company}</Link></li>
        <li><FaChevronRight aria-hidden="true" /><span aria-current="page">{name}</span></li>
      </ol></nav>
      <header className="insurance-intro">
        <Link href={`/company/${insurance.companyId}`} className="insurance-insurer"><AssetImage src={insurance.companyLogo} alt="" sizes="64px" className="insurance-insurer-logo" fallback={<FaBuilding />} priority /><span>{company}<FaArrowRight aria-hidden="true" /></span></Link>
        <p className="insurance-category">{insurance.category.trim() || companyText('otherCategory')}</p>
        <h1 id="insurance-title">{name}</h1>
        {insurance.description.trim() && <p className="insurance-description">{insurance.description}</p>}
        <Button href="#contact" variant="secondary">{nav('contact')}<FaArrowRight aria-hidden="true" /></Button>
      </header>
      <div className="insurance-layout">
        <article className="insurance-content" aria-labelledby="insurance-title">
          {hasContent ? <>
            {insurance.contentLocale !== locale && <p className="article-language-notice">{t('englishFallback')}</p>}
            <InsuranceArticle html={insurance.contentHtml} text={insurance.contentText} language={insurance.contentLocale!} />
          </> : <div className="insurance-overview"><h2>{t('overviewTitle')}</h2><p>{t('overviewBody')}</p></div>}
        </article>
        <InsuranceContactPanel />
      </div>
    </div>
    <MobileAdvisorBar />
  </div>;
}
