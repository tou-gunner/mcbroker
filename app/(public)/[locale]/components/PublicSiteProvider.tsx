"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { normalizeContact, type ContactDetails } from '@/app/utils/contact';

type PageContact = { pathname: string; locale: string; companyName: string; productName?: string };

const SiteContext = createContext<{
  contact: ContactDetails;
  contactLoaded: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  companyName?: string;
  productName?: string;
  registerContact: (page: PageContact) => () => void;
} | null>(null);

export default function PublicSiteProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<ContactDetails>({});
  const [contactLoaded, setContactLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactPage, setContactPage] = useState<PageContact | null>(null);
  const pathname = usePathname();
  const locale = useLocale();
  const currentPage = contactPage?.pathname === pathname && contactPage.locale === locale ? contactPage : null;
  const companyName = currentPage?.companyName;
  const productName = currentPage?.productName;
  const registerContact = useCallback((page: PageContact) => {
    setContactPage(page);
    return () => setContactPage(current => current === page ? null : current);
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
  return <SiteContext.Provider value={{ contact, contactLoaded, menuOpen, setMenuOpen, companyName, productName, registerContact }}>{children}</SiteContext.Provider>;
}

export function usePublicSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('Public components require PublicSiteProvider');
  return context;
}

const subscribeOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export function PageContactRegistration({ companyName, productName }: { companyName: string; productName?: string }) {
  const { registerContact } = usePublicSite();
  const pathname = usePathname();
  const locale = useLocale();
  useEffect(() => registerContact({ pathname, locale, companyName, productName }), [registerContact, pathname, locale, companyName, productName]);
  return null;
}

export function CompanyContactRegistration({ name }: { name: string }) {
  return <PageContactRegistration companyName={name} />;
}

export function AdvisorLink(props: Omit<ComponentProps<'a'>, 'href'>) {
  const { companyName } = usePublicSite();
  const pathname = usePathname();
  return pathname === '/' || companyName
    ? <a {...props} href="#contact" />
    : <Link {...props} href="/#contact" />;
}

export function useWhatsAppLink() {
  const { contact, companyName, productName } = usePublicSite();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('contact');
  const origin = useSyncExternalStore(subscribeOrigin, getOrigin, getServerOrigin);
  const pageUrl = `${origin}/${locale}${pathname === '/' ? '' : pathname}`;
  const message = productName && companyName ? t('productMessage', { product: productName, company: companyName, url: pageUrl }) : companyName ? t('companyMessage', { company: companyName, url: pageUrl }) : t('message', { url: pageUrl });
  return contact.whatsapp && origin ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}` : undefined;
}
