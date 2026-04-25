import { ReactNode } from "react";
import { poppins } from "../../fonts";

interface SectionProps {
    id?: string;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    containerClassName?: string;
    headingAlign?: "left" | "center";
}

export default function Section({
    id,
    eyebrow,
    title,
    subtitle,
    children,
    className = "",
    containerClassName = "",
    headingAlign = "center",
}: SectionProps) {
    const alignClass = headingAlign === "center" ? "text-center mx-auto" : "text-left";
    const showHeader = Boolean(eyebrow || title || subtitle);

    return (
        <section id={id} className={`w-full py-16 md:py-24 px-6 md:px-10 ${className}`}>
            <div className={`max-w-6xl mx-auto ${containerClassName}`}>
                {showHeader && (
                    <div className={`mb-10 md:mb-14 max-w-3xl ${alignClass}`}>
                        {eyebrow && (
                            <div className={`${poppins.className} text-accent text-sm font-semibold tracking-[0.2em] uppercase mb-3`}>
                                {eyebrow}
                            </div>
                        )}
                        {title && (
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}
