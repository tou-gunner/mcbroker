import { useTranslations } from 'next-intl';
import { FaPlus } from 'react-icons/fa6';
export default function FaqSection() {
  const t = useTranslations('faq');
  const items = t.raw('items') as { q: string; a: string }[];
  return <section id="faq" className="site-section faq-section" aria-labelledby="faq-title"><div className="site-container faq-layout">
    <div className="section-heading"><p className="eyebrow">{t('eyebrow')}</p><h2 id="faq-title" tabIndex={-1}>{t('title')}</h2><p className="section-description">{t('subtitle')}</p><a className="inline-link" href="#contact">{t('contact')}<span aria-hidden="true"> ↗</span></a></div>
    <div className="faq-list">{items.map((item, i) => <details key={i}><summary><span>{item.q}</span><FaPlus aria-hidden="true" /></summary><p>{item.a}</p></details>)}</div>
  </div></section>;
}
