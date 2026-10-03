"use client";

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { FaComments } from 'react-icons/fa6';
import ContactActions from '../../components/ContactActions';

export default function InsuranceContactPanel() {
  const t = useTranslations('insurance');
  const panel = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState({ sticky: false, top: 104 });
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const header = document.querySelector('.site-header');
    const measure = () => {
      const top = (header?.getBoundingClientRect().height ?? 80) + 24;
      const sticky = window.innerWidth >= 1024 && element.getBoundingClientRect().height + top + 24 <= window.innerHeight;
      setLayout(current => current.sticky === sticky && current.top === top ? current : { sticky, top });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (header) observer.observe(header);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <aside ref={panel} id="contact" className="insurance-contact" data-sticky={layout.sticky} style={{ '--advisor-top': `${layout.top}px` } as CSSProperties} aria-labelledby="contact-title">
    <span className="contact-symbol"><FaComments aria-hidden="true" /></span>
    <h2 id="contact-title" tabIndex={-1}>{t('advisorTitle')}</h2>
    <p>{t('advisorBody')}</p>
    <ContactActions />
  </aside>;
}
