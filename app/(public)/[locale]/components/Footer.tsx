"use client";
import { useTranslations } from 'next-intl';
import { FaPhone, FaEnvelope, FaWhatsapp, FaShieldHeart } from 'react-icons/fa6';
import { Link, usePathname } from '@/i18n/routing';
import { CATEGORY_SLUGS } from '@/app/utils/catalog';
import { usePublicSite, useWhatsAppLink } from './PublicSiteProvider';
import AssetImage from './ui/AssetImage';
export default function Footer() {
  const t = useTranslations();
  const { contact, contactLoaded } = usePublicSite();
  const whatsapp = useWhatsAppLink();
  const isHome = usePathname() === '/';
  return <footer className={`site-footer ${isHome ? 'site-footer--home' : ''}`}><div className="site-container footer-grid">
    <div className="footer-brand"><Link href="/" className="brand"><AssetImage src="https://s3.mcins.la/mcins/site/logo.png" alt="" sizes="44px" className="brand-logo" fallback={<FaShieldHeart />} /><span>MC<span className="brand-light"> Broker</span></span></Link><p>{t('footer.brandBlurb')}</p></div>
    <div><h2>{t('footer.links.title')}</h2><ul><li><Link href="/">{t('navigation.home')}</Link></li><li><Link href="/#company-list">{t('navigation.companies')}</Link></li><li><Link href="/#how-it-works">{t('navigation.howItWorks')}</Link></li><li><Link href="/#faq">{t('navigation.faq')}</Link></li></ul></div>
    <div><h2>{t('navigation.types')}</h2><ul>{CATEGORY_SLUGS.map(slug => <li key={slug}><Link href={`/?category=${slug}#company-list`}>{t(`categories.items.${slug}`)}</Link></li>)}</ul></div>
    <div><h2>{t('footer.contactTitle')}</h2><ul className="footer-contact">
      {contact.phone && <li><FaPhone aria-hidden="true" /><a href={`tel:${contact.phone}`}>{contact.phone}</a></li>}
      {whatsapp && <li><FaWhatsapp aria-hidden="true" /><a href={whatsapp}>{t('contact.whatsapp')}</a></li>}
      {contact.email && <li><FaEnvelope aria-hidden="true" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
    </ul>{!contact.phone && !contact.whatsapp && !contact.email && <p className="footer-unavailable">{t(contactLoaded ? 'contact.unavailable' : 'contact.loading')}</p>}<Link href="/#contact" className="footer-advisor">{t('navigation.contact')} ↗</Link></div>
  </div><div className="site-container footer-bottom"><span>© {new Date().getFullYear()} MC Broker. {t('footer.copyright')}.</span><span>{t('footer.tagline')}</span></div></footer>;
}
