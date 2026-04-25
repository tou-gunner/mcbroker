import { useTranslations } from "next-intl";
import { FaShieldHalved, FaScaleBalanced, FaHandshake, FaHeadset } from "react-icons/fa6";
import { IconType } from "react-icons";

interface Card {
    icon: IconType;
    titleKey: string;
    bodyKey: string;
}

const CARDS: Card[] = [
    { icon: FaShieldHalved, titleKey: "licensed.title", bodyKey: "licensed.body" },
    { icon: FaScaleBalanced, titleKey: "compare.title", bodyKey: "compare.body" },
    { icon: FaHandshake, titleKey: "claims.title", bodyKey: "claims.body" },
    { icon: FaHeadset, titleKey: "free.title", bodyKey: "free.body" },
];

export default function WhyBrokerStrip() {
    const t = useTranslations("why.cards");

    return (
        <div className="w-full px-6 md:px-10 -mt-16 md:-mt-20 relative z-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {CARDS.map(({ icon: Icon, titleKey, bodyKey }) => (
                    <div
                        key={titleKey}
                        className="bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300 ring-1 ring-slate-100"
                    >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                            {t(titleKey)}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {t(bodyKey)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
