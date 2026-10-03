"use client";
import { useTranslations } from 'next-intl';
import { FaPhone, FaWhatsapp, FaComments } from 'react-icons/fa6';
import Button from './ui/Button';
import { usePublicSite, useWhatsAppLink } from './PublicSiteProvider';
export default function CtaBand() {
  const t = useTranslations('contact');
  const { contact, contactLoaded } = usePublicSite();
  const whatsapp = useWhatsAppLink();
  const unavailable = !contact.phone || !contact.whatsapp;
  return <section id="contact" className="site-section contact-section" aria-labelledby="contact-title"><div className="site-container"><div className="contact-panel">
    <div className="contact-copy"><span className="contact-symbol"><FaComments aria-hidden="true" /></span><p className="eyebrow">{t('eyebrow')}</p><h2 id="contact-title" tabIndex={-1}>{t('title')}</h2><p>{t('body')}</p></div>
    <div className="contact-actions">
      {contact.phone ? <Button href={`tel:${contact.phone}`}><FaPhone aria-hidden="true" />{t('call')}</Button> : <Button disabled aria-describedby="contact-availability"><FaPhone aria-hidden="true" />{t('call')}</Button>}
      {whatsapp ? <Button href={whatsapp} variant="secondary" external><FaWhatsapp aria-hidden="true" />{t('whatsapp')}</Button> : <Button variant="secondary" disabled aria-describedby="contact-availability"><FaWhatsapp aria-hidden="true" />{t('whatsapp')}</Button>}
      {unavailable && <p id="contact-availability" className="contact-availability" role="status">{t(contactLoaded ? 'unavailable' : 'loading')}</p>}
    </div>
  </div></div></section>;
}
