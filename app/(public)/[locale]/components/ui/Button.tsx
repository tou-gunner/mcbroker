import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { Link } from "@/i18n/routing";

type Variant = "primary" | "secondary" | "ghost" | "white";
type Size = "sm" | "md" | "lg";

interface BaseProps {
    variant?: Variant;
    size?: Size;
    children: ReactNode;
    className?: string;
}

interface LinkProps extends BaseProps {
    href: string;
    external?: boolean;
    onClick?: never;
    type?: never;
}

interface ButtonAsButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps | "href"> {
    href?: undefined;
}

type Props = LinkProps | ButtonAsButtonProps;

const variantClasses: Record<Variant, string> = {
    primary: "bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg",
    secondary: "bg-accent hover:bg-accent/90 text-white shadow-md hover:shadow-lg",
    ghost: "bg-transparent hover:bg-white/10 text-white border border-white/40 hover:border-white",
    white: "bg-white hover:bg-slate-50 text-primary shadow-md hover:shadow-lg",
};

const sizeClasses: Record<Size, string> = {
    sm: "text-sm px-4 py-2",
    md: "text-base px-6 py-3",
    lg: "text-base md:text-lg px-8 py-3.5",
};

export default function Button(props: Props) {
    const { variant = "primary", size = "md", className = "", children } = props;
    const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if ("href" in props && props.href !== undefined) {
        const { href, external, ...rest } = props as LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>;
        void rest;
        if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("#")) {
            return (
                <a href={href} className={classes}>
                    {children}
                </a>
            );
        }
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    const { variant: _v, size: _s, className: _c, children: _ch, ...buttonRest } = props as ButtonAsButtonProps;
    void _v; void _s; void _c; void _ch;
    return (
        <button className={classes} {...buttonRest}>
            {children}
        </button>
    );
}
