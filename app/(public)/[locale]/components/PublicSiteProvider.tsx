"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { normalizeContact, type ContactDetails } from '@/app/utils/contact';

const SiteContext = createContext<{
  contact: ContactDetails;
  contactLoaded: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
} | null>(null);

export default function PublicSiteProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<ContactDetails>({});
  const [contactLoaded, setContactLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
  return <SiteContext.Provider value={{ contact, contactLoaded, menuOpen, setMenuOpen }}>{children}</SiteContext.Provider>;
}

export function usePublicSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('Public components require PublicSiteProvider');
  return context;
}

const subscribeOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export function useWhatsAppLink() {
  const { contact } = usePublicSite();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('contact');
  const origin = useSyncExternalStore(subscribeOrigin, getOrigin, getServerOrigin);
  const pageUrl = `${origin}/${locale}${pathname === '/' ? '' : pathname}`;
  return contact.whatsapp && origin ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(t('message', { url: pageUrl }))}` : undefined;
}
