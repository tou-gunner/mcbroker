import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  headingAlign?: 'left' | 'center';
}
export default function Section({ id, eyebrow, title, subtitle, children, className = '', containerClassName = '', headingAlign = 'left' }: SectionProps) {
  return <section id={id} className={`site-section ${className}`} aria-labelledby={id && title ? `${id}-title` : undefined}>
    <div className={`site-container ${containerClassName}`}>
      {(eyebrow || title || subtitle) && <div className={`section-heading ${headingAlign === 'center' ? 'section-heading--center' : ''}`}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2 id={id ? `${id}-title` : undefined} tabIndex={-1}>{title}</h2>}
        {subtitle && <p className="section-description">{subtitle}</p>}
      </div>}
      {children}
    </div>
  </section>;
}
