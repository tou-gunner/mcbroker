import { getTranslations } from 'next-intl/server';
import { FaFileCircleQuestion } from 'react-icons/fa6';
import Button from '../../components/ui/Button';

export default async function InsuranceNotFound() {
  const t = await getTranslations('insurance');
  const nav = await getTranslations('navigation');
  return <div className="insurance-page site-container company-unavailable"><div className="catalog-state">
    <FaFileCircleQuestion aria-hidden="true" /><h1>{t('unavailableTitle')}</h1><p>{t('unavailableBody')}</p>
    <div className="catalog-state-actions"><Button href="/#company-list">{t('backToDirectory')}</Button><Button href="/" variant="secondary">{nav('home')}</Button></div>
  </div></div>;
}
