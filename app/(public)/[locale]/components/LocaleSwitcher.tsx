"use client";
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { FaGlobe } from 'react-icons/fa6';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  return <label className="locale-select">
    <FaGlobe aria-hidden="true" />
    <span className="sr-only">{t('language')}</span>
    <select aria-label={t('language')} value={locale} disabled={pending} onChange={event => {
      const nextLocale = event.target.value;
      startTransition(() => router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: nextLocale, scroll: false }));
    }}>
      <option value="lo" lang="lo">ລາວ</option>
      <option value="en" lang="en">English</option>
    </select>
  </label>;
}
