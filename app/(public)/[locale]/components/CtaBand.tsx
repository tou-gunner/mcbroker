"use client";
import { useTranslations } from 'next-intl';
import { FaComments } from 'react-icons/fa6';
import ContactActions from './ContactActions';
import { usePublicSite } from './PublicSiteProvider';
export default function CtaBand() {
  const t = useTranslations('contact');
  const { companyName } = usePublicSite();
  return <section id="contact" className="site-section contact-section" aria-labelledby="contact-title"><div className="site-container"><div className="contact-panel">
    <div className="contact-copy"><span className="contact-symbol"><FaComments aria-hidden="true" /></span><p className="eyebrow">{t('eyebrow')}</p><h2 id="contact-title" tabIndex={-1}>{t('title')}</h2><p>{companyName ? t('companyBody', { company: companyName }) : t('body')}</p></div>
    <ContactActions />
  </div></div></section>;
}
