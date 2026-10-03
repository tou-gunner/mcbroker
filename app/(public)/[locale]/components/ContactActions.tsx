"use client";

import { useTranslations } from 'next-intl';
import { FaPhone, FaWhatsapp } from 'react-icons/fa6';
import Button from './ui/Button';
import { usePublicSite, useWhatsAppLink } from './PublicSiteProvider';

export default function ContactActions() {
  const t = useTranslations('contact');
  const { contact, contactLoaded } = usePublicSite();
  const whatsapp = useWhatsAppLink();
  const unavailable = !contact.phone || !whatsapp;
  return <div className="contact-actions">
    {contact.phone ? <Button href={`tel:${contact.phone}`}><FaPhone aria-hidden="true" />{t('call')}</Button> : <Button disabled aria-describedby="contact-availability"><FaPhone aria-hidden="true" />{t('call')}</Button>}
    {whatsapp ? <Button href={whatsapp} variant="secondary" external><FaWhatsapp aria-hidden="true" />{t('whatsapp')}</Button> : <Button variant="secondary" disabled aria-describedby="contact-availability"><FaWhatsapp aria-hidden="true" />{t('whatsapp')}</Button>}
    {unavailable && <p id="contact-availability" className="contact-availability" role="status">{t(contactLoaded ? 'unavailable' : 'loading')}</p>}
  </div>;
}
