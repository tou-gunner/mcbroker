import { getTranslations } from 'next-intl/server';
import { FaBuilding } from 'react-icons/fa6';
import Button from '../../components/ui/Button';

export default async function CompanyNotFound() {
  const t = await getTranslations('company');
  const nav = await getTranslations('navigation');
  return <div className="company-page site-container company-unavailable"><div className="catalog-state">
    <FaBuilding aria-hidden="true" /><h1>{t('unavailableTitle')}</h1><p>{t('unavailableBody')}</p>
    <div className="catalog-state-actions"><Button href="/#company-list">{t('backToDirectory')}</Button><Button href="/" variant="secondary">{nav('home')}</Button></div>
  </div></div>;
}
