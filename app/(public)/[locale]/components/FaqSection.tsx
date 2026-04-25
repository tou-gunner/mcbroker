import { useTranslations } from "next-intl";
import { FaPlus } from "react-icons/fa6";
import Section from "./ui/Section";

interface FaqItem {
    q: string;
    a: string;
}

export default function FaqSection() {
    const t = useTranslations("faq");
    const items = t.raw("items") as FaqItem[];

    return (
        <Section
            id="faq"
            eyebrow={t("eyebrow")}
            title={t("title")}
            className="bg-white"
            containerClassName="max-w-3xl"
        >
            <div className="flex flex-col gap-3">
                {items.map((item, idx) => (
                    <details
                        key={idx}
                        className="group bg-slate-50 hover:bg-slate-100/70 rounded-2xl ring-1 ring-slate-200 open:ring-primary/40 open:bg-white open:shadow-sm transition-all"
                    >
                        <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                            <span className="text-base md:text-lg font-semibold text-slate-900">
                                {item.q}
                            </span>
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white ring-1 ring-slate-200 text-primary flex items-center justify-center transition-transform duration-300 group-open:rotate-45">
                                <FaPlus size={12} />
                            </span>
                        </summary>
                        <div className="px-5 pb-5 -mt-1 text-slate-600 leading-relaxed">
                            {item.a}
                        </div>
                    </details>
                ))}
            </div>
        </Section>
    );
}
