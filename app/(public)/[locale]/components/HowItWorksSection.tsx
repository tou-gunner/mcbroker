import { useTranslations } from "next-intl";
import { FaCommentDots, FaMagnifyingGlass, FaCircleCheck } from "react-icons/fa6";
import { IconType } from "react-icons";
import Section from "./ui/Section";

interface Step {
    num: string;
    icon: IconType;
    key: string;
}

const STEPS: Step[] = [
    { num: "01", icon: FaCommentDots, key: "1" },
    { num: "02", icon: FaMagnifyingGlass, key: "2" },
    { num: "03", icon: FaCircleCheck, key: "3" },
];

export default function HowItWorksSection() {
    const t = useTranslations("how");

    return (
        <Section
            id="how-it-works"
            eyebrow={t("eyebrow")}
            title={t("title")}
            className="bg-slate-50"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
                {STEPS.map(({ num, icon: Icon, key }, idx) => (
                    <div key={key} className="relative">
                        <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-100 h-full flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Icon size={26} />
                                </div>
                                <span className="text-5xl font-extrabold text-slate-100 leading-none select-none">
                                    {num}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {t(`steps.${key}.title`)}
                            </h3>
                            <p className="text-base text-slate-600 leading-relaxed">
                                {t(`steps.${key}.body`)}
                            </p>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-slate-300" />
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
}
