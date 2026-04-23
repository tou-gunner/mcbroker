'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const locales = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'lo', label: 'ລາວ', flag: '🇱🇦' }
  ];

  const currentLocale = locales.find(l => l.code === locale);

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span className="text-xl">{currentLocale?.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                locale === loc.code ? 'bg-gray-50 font-semibold' : ''
              }`}
            >
              <span className="text-xl">{loc.flag}</span>
              <span>{loc.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

