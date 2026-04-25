import { FaPhone, FaLocationDot, FaEnvelope } from "react-icons/fa6";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const CATEGORY_SLUGS = ["life", "health", "accident", "travel", "home", "car", "business"] as const;

export default function Footer() {
    const t = useTranslations();
    const year = new Date().getFullYear();

    return (
        <footer className="w-full bg-slate-950 text-slate-300">
            <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src="https://s3.mcins.la/mcins/site/logo.png"
                            alt="MC Broker"
                            className="h-12 w-12 object-contain bg-white rounded-lg p-1"
                        />
                        <span className="text-white text-xl font-bold">MC Broker</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400">
                        {t("footer.brandBlurb")}
                    </p>
                </div>

                <div>
                    <h3 className="text-white font-semibold mb-4 text-base">
                        {t("footer.links.title")}
                    </h3>
                    <ul className="flex flex-col gap-2.5 text-sm">
                        <li>
                            <Link href="/" className="hover:text-white transition-colors">
                                {t("footer.links.home")}
                            </Link>
                        </li>
                        <li>
                            <a href="#company-list" className="hover:text-white transition-colors">
                                {t("footer.links.companies")}
                            </a>
                        </li>
                        <li>
                            <a href="#how-it-works" className="hover:text-white transition-colors">
                                {t("footer.links.about")}
                            </a>
                        </li>
                        <li>
                            <a href="#faq" className="hover:text-white transition-colors">
                                {t("faq.title")}
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold mb-4 text-base">
                        {t("footer.categories.title")}
                    </h3>
                    <ul className="flex flex-col gap-2.5 text-sm">
                        {CATEGORY_SLUGS.map((slug) => (
                            <li key={slug}>
                                <a
                                    href="#company-list"
                                    className="hover:text-white transition-colors"
                                >
                                    {t(`categories.items.${slug}`)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold mb-4 text-base">
                        {t("footer.contact.title")}
                    </h3>
                    <ul className="flex flex-col gap-3 text-sm">
                        <li className="flex items-start gap-3">
                            <FaLocationDot className="mt-1 flex-shrink-0 text-accent" />
                            <span>{t("footer.contact.address")}</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <FaPhone className="mt-1 flex-shrink-0 text-accent" />
                            <a href="tel:+85621123456" className="hover:text-white transition-colors">
                                {t("footer.contact.phoneOffice")}
                            </a>
                        </li>
                        <li className="flex items-start gap-3">
                            <FaPhone className="mt-1 flex-shrink-0 text-accent" />
                            <a href="tel:+85621123456" className="hover:text-white transition-colors">
                                {t("footer.contact.phoneMobile")}
                            </a>
                        </li>
                        <li className="flex items-start gap-3">
                            <FaEnvelope className="mt-1 flex-shrink-0 text-accent" />
                            <a
                                href="mailto:info@mcins.la"
                                className="hover:text-white transition-colors break-all"
                            >
                                info@mcins.la
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-slate-800">
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-5 text-xs text-slate-500 text-center sm:text-left flex flex-col sm:flex-row sm:justify-between gap-2">
                    <span>© {year} MC Broker. {t("footer.copyright")}.</span>
                    <span>Vientiane, Lao PDR</span>
                </div>
            </div>
        </footer>
    );
}
