"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { normalizeContact, type ContactDetails } from '@/app/utils/contact';

type CompanyContact = { pathname: string; locale: string; name: string };

const SiteContext = createContext<{
  contact: ContactDetails;
  contactLoaded: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  companyName?: string;
  registerCompanyContact: (page: CompanyContact) => () => void;
} | null>(null);

export default function PublicSiteProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<ContactDetails>({});
  const [contactLoaded, setContactLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyPage, setCompanyPage] = useState<CompanyContact | null>(null);
  const pathname = usePathname();
  const locale = useLocale();
  const companyName = companyPage?.pathname === pathname && companyPage.locale === locale ? companyPage.name : undefined;
  const registerCompanyContact = useCallback((page: CompanyContact) => {
    setCompanyPage(page);
    return () => setCompanyPage(current => current === page ? null : current);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/settings?prefix=contact_&locale=en', { signal: controller.signal });
        if (!response.ok) throw new Error('Contact request failed');
        const data = await response.json();
        if (data.success && data.data && !controller.signal.aborted) setContact(normalizeContact(data.data));
      } catch { /* Unconfigured or unavailable destinations remain inactive. */ }
      finally { if (!controller.signal.aborted) setContactLoaded(true); }
    }
    void load();
    return () => controller.abort();
  }, []);
  return <SiteContext.Provider value={{ contact, contactLoaded, menuOpen, setMenuOpen, companyName, registerCompanyContact }}>{children}</SiteContext.Provider>;
}

export function usePublicSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('Public components require PublicSiteProvider');
  return context;
}

const subscribeOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export function CompanyContactRegistration({ name }: { name: string }) {
  const { registerCompanyContact } = usePublicSite();
  const pathname = usePathname();
  const locale = useLocale();
  useEffect(() => registerCompanyContact({ pathname, locale, name }), [registerCompanyContact, pathname, locale, name]);
  return null;
}

export function AdvisorLink(props: Omit<ComponentProps<'a'>, 'href'>) {
  const { companyName } = usePublicSite();
  const pathname = usePathname();
  return pathname === '/' || companyName
    ? <a {...props} href="#contact" />
    : <Link {...props} href="/#contact" />;
}

export function useWhatsAppLink() {
  const { contact, companyName } = usePublicSite();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('contact');
  const origin = useSyncExternalStore(subscribeOrigin, getOrigin, getServerOrigin);
  const pageUrl = `${origin}/${locale}${pathname === '/' ? '' : pathname}`;
  const message = companyName ? t('companyMessage', { company: companyName, url: pageUrl }) : t('message', { url: pageUrl });
  return contact.whatsapp && origin ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}` : undefined;
}
