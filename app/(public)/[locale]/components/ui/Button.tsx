import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import { Link } from '@/i18n/routing';

type BaseProps = { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'white'; size?: 'sm' | 'md' | 'lg'; className?: string };
type LinkProps = BaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | 'href'> & { href: string; external?: boolean; disabled?: never };
type ButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }: LinkProps | ButtonProps) {
  const classes = `site-button site-button--${variant} site-button--${size} ${className}`;
  if (props.href !== undefined) {
    const { href, external, ...rest } = props;
    if (external || /^(https?:|tel:|mailto:|#)/.test(href)) return <a {...rest} href={href} className={classes} />;
    return <Link {...rest} href={href} className={classes} />;
  }
  return <button type="button" {...props} className={classes} />;
}
