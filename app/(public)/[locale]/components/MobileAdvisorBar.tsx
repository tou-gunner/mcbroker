"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FaCommentDots, FaArrowRight } from 'react-icons/fa6';
import { usePublicSite } from './PublicSiteProvider';
import { focusSection } from '@/app/utils/catalog';
export default function MobileAdvisorBar() {
  const t = useTranslations('navigation');
  const { menuOpen } = usePublicSite();
  const [contactVisible, setContactVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const contact = document.getElementById('contact');
    const observer = new IntersectionObserver(entries => setContactVisible(entries[0]?.isIntersecting ?? false), { rootMargin: '-80px 0px 0px 0px' });
    if (contact) observer.observe(contact);
    const onFocus = () => setEditing(document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') ?? false);
    const onBlur = () => queueMicrotask(onFocus);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => { observer.disconnect(); document.removeEventListener('focusin', onFocus); document.removeEventListener('focusout', onBlur); };
  }, []);
  return <div className="mobile-advisor" hidden={menuOpen || contactVisible || editing}><button type="button" className="site-button site-button--primary" onClick={() => focusSection('contact')}><FaCommentDots aria-hidden="true" />{t('contact')}<FaArrowRight aria-hidden="true" /></button></div>;
}
