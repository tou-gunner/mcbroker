"use client";
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FaArrowUpRightFromSquare, FaBars, FaXmark, FaShieldHeart } from 'react-icons/fa6';
import { Link } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';
import AssetImage from './ui/AssetImage';
import { AdvisorLink, usePublicSite } from './PublicSiteProvider';

const links = [
  ['types', '/#insurance-types'], ['companies', '/#company-list'], ['howItWorks', '/#how-it-works'], ['faq', '/#faq'],
] as const;

export default function NavigationBar() {
  const t = useTranslations('navigation');
  const { menuOpen, setMenuOpen } = usePublicSite();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!menuOpen) { if (element.open) element.close(); return; }
    element.showModal();
    const triggerElement = trigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const media = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (media.matches) setMenuOpen(false); };
    media.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      media.removeEventListener('change', onResize);
      element.close();
      triggerElement?.focus({ preventScroll: true });
    };
  }, [menuOpen, setMenuOpen]);

  return <header className="site-header">
    <a className="skip-link" href="#main-content">{t('skip')}</a>
    <div className="site-container header-inner">
      <Link href="/" className="brand" aria-label={`MC Broker — ${t('home')}`}>
        <AssetImage src="https://s3.mcins.la/mcins/site/logo.png" alt="" sizes="44px" className="brand-logo" fallback={<FaShieldHeart />} />
        <span>MC<span className="brand-light"> Broker</span></span>
      </Link>
      <nav className="desktop-nav" aria-label={t('main')}>
        {links.map(([key, href]) => <Link key={key} href={href}>{t(key)}</Link>)}
      </nav>
      <div className="header-actions">
        <LocaleSwitcher />
        <AdvisorLink className="site-button site-button--primary header-advisor">{t('contact')}<FaArrowUpRightFromSquare aria-hidden="true" /></AdvisorLink>
        <button ref={trigger} className="icon-button menu-trigger" type="button" aria-label={t('openMenu')} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(true)}><FaBars aria-hidden="true" /></button>
      </div>
    </div>
    <dialog id="mobile-menu" ref={dialog} className="mobile-menu" aria-label={t('main')} onCancel={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMenuOpen(false); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select:not(:disabled)');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }}>
      <div className="mobile-menu-inner">
        <div className="mobile-menu-heading"><strong>MC Broker</strong><button type="button" className="icon-button" aria-label={t('closeMenu')} onClick={() => setMenuOpen(false)}><FaXmark aria-hidden="true" /></button></div>
        <nav aria-label={t('main')}>
          {links.map(([key, href]) => <Link href={href} key={key} onClick={() => setMenuOpen(false)}>{t(key)}<span aria-hidden="true">↗</span></Link>)}
        </nav>
        <AdvisorLink className="site-button site-button--primary" onClick={() => setMenuOpen(false)}>{t('contact')}</AdvisorLink>
      </div>
    </dialog>
  </header>;
}
