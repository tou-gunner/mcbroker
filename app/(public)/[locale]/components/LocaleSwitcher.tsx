'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';

interface Props {
    variant?: 'light' | 'dark';
}

export default function LocaleSwitcher({ variant = 'dark' }: Props) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const locales = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'lo', label: 'ລາວ', flag: '🇱🇦' }
    ];

    const currentLocale = locales.find(l => l.code === locale);

    useEffect(() => {
        if (!isOpen) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [isOpen]);

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
        setIsOpen(false);
    };

    const triggerClass =
        variant === 'light'
            ? 'text-white hover:bg-white/10'
            : 'text-slate-700 hover:bg-slate-100';

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md transition-colors text-sm font-medium ${triggerClass}`}
                aria-label="Switch language"
            >
                <span className="text-lg leading-none">{currentLocale?.flag}</span>
                <span className="hidden sm:inline uppercase tracking-wider">{locale}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 py-1.5 z-50 overflow-hidden">
                    {locales.map((loc) => (
                        <button
                            key={loc.code}
                            onClick={() => handleLocaleChange(loc.code)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors ${
                                locale === loc.code ? 'text-primary font-semibold bg-primary/5' : 'text-slate-700'
                            }`}
                        >
                            <span className="text-lg leading-none">{loc.flag}</span>
                            <span>{loc.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
