"use client";

import { useTranslations } from "next-intl";
import {
    FaHeartPulse,
    FaUserInjured,
    FaPlane,
    FaHouse,
    FaCar,
    FaBriefcase,
    FaShieldHalved,
} from "react-icons/fa6";
import { IconType } from "react-icons";
import { useAppContext } from "@/app/contexts";
import Section from "./ui/Section";

interface Category {
    slug: string;
    icon: IconType;
    accent: string;
}

const CATEGORIES: Category[] = [
    { slug: "life", icon: FaShieldHalved, accent: "from-rose-500/10 to-rose-500/0 text-rose-600" },
    { slug: "health", icon: FaHeartPulse, accent: "from-emerald-500/10 to-emerald-500/0 text-emerald-600" },
    { slug: "accident", icon: FaUserInjured, accent: "from-amber-500/10 to-amber-500/0 text-amber-600" },
    { slug: "travel", icon: FaPlane, accent: "from-sky-500/10 to-sky-500/0 text-sky-600" },
    { slug: "home", icon: FaHouse, accent: "from-indigo-500/10 to-indigo-500/0 text-indigo-600" },
    { slug: "car", icon: FaCar, accent: "from-blue-500/10 to-blue-500/0 text-blue-600" },
    { slug: "business", icon: FaBriefcase, accent: "from-violet-500/10 to-violet-500/0 text-violet-600" },
];

export default function CategoriesSection() {
    const t = useTranslations("categories");
    const { setSelectedFilter } = useAppContext();

    const handleClick = (slug: string) => {
        setSelectedFilter(slug);
        const target = document.getElementById("company-list");
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <Section
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
            className="bg-white"
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
                {CATEGORIES.map(({ slug, icon: Icon, accent }) => (
                    <button
                        key={slug}
                        onClick={() => handleClick(slug)}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} bg-slate-50 ring-1 ring-slate-200 hover:ring-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col items-center gap-3 text-center cursor-pointer`}
                    >
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                            <Icon size={22} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 leading-tight">
                            {t(`items.${slug}`)}
                        </span>
                    </button>
                ))}
            </div>
        </Section>
    );
}
