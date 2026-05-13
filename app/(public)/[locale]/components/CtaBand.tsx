import { useTranslations } from "next-intl";
import { FaPhone, FaArrowRight } from "react-icons/fa6";
import Button from "./ui/Button";

export default function CtaBand() {
    const t = useTranslations("ctaBand");

    return (
        <section id="contact" className="w-full py-16 md:py-20 px-6 md:px-10 scroll-mt-20">
            <div className="max-w-6xl mx-auto">
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary-dark to-slate-900 text-white p-8 md:p-12 lg:p-16">
                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary/40 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
                                {t("title")}
                            </h2>
                            <p className="text-white/80 text-base md:text-lg leading-relaxed">
                                {t("body")}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button href="tel:+85621123456" variant="secondary" size="lg">
                                <FaPhone size={16} />
                                {t("phone")}
                            </Button>
                            <Button href="#company-list" variant="white" size="lg">
                                {t("primary")}
                                <FaArrowRight size={14} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
