'use client';

import { useState, useEffect } from "react";
import { FaBars, FaXmark, FaPhone } from "react-icons/fa6";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import LocaleSwitcher from "./LocaleSwitcher";

interface NavLink {
    labelKey: string;
    href: string;
}

const NAV_LINKS: NavLink[] = [
    { labelKey: "home", href: "/" },
    { labelKey: "companies", href: "/#company-list" },
    { labelKey: "howItWorks", href: "/#how-it-works" },
    { labelKey: "faq", href: "/#faq" },
];

const NAV_HEIGHT = 64;
const SCROLL_THRESHOLD = 80;

export default function NavigationBar() {
    const t = useTranslations("navigation");
    const pathname = usePathname();
    const isHome = pathname === "/";

    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > SCROLL_THRESHOLD);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const transparent = isHome && !scrolled;

    const barClass = transparent
        ? "bg-transparent"
        : "bg-white/95 backdrop-blur-md shadow-sm";
    const linkColor = transparent
        ? "text-white/90 hover:text-white"
        : "text-slate-700 hover:text-primary";
    const logoTextColor = transparent ? "text-white" : "text-primary";
    const iconButtonClass = transparent
        ? "text-white hover:bg-white/10"
        : "text-primary hover:bg-slate-100";

    return (
        <>
            {/* Spacer in normal flow — pushes page content down except on home (where hero sits flush under the fixed nav) */}
            <div aria-hidden style={{ height: isHome ? 0 : NAV_HEIGHT }} />

            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${barClass}`}
                style={{ height: NAV_HEIGHT }}
            >
                <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-6">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <img
                            src="https://s3.mcins.la/mcins/site/logo.png"
                            alt="MC Broker"
                            className="h-10 w-10 object-contain rounded-md bg-white p-0.5 shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <span className={`hidden sm:inline font-bold text-lg tracking-tight ${logoTextColor}`}>
                            MC Broker
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.labelKey}
                                href={link.href}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${linkColor}`}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <LocaleSwitcher variant={transparent ? "light" : "dark"} />

                        <a
                            href="#contact"
                            className="hidden sm:inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                        >
                            <FaPhone size={12} />
                            {t("contact")}
                        </a>

                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className={`md:hidden p-2 rounded-md transition-colors ${iconButtonClass}`}
                            aria-label="Open menu"
                        >
                            <FaBars size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile drawer */}
            <div
                className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            >
                <div
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
                <div
                    className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
                        isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <span className="font-bold text-lg text-primary">MC Broker</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                            aria-label="Close menu"
                        >
                            <FaXmark size={22} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.labelKey}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-6 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 hover:text-primary border-b border-slate-100"
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </div>

                    <div className="p-5 border-t border-slate-100 flex flex-col gap-3">
                        <a
                            href="#contact"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-3 rounded-full shadow-md transition-all"
                        >
                            <FaPhone size={14} />
                            {t("contact")}
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
