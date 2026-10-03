"use client";
import { useTranslations } from 'next-intl';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { CATEGORY_SLUGS, focusSection } from '@/app/utils/catalog';
import { useAppContext } from '@/app/contexts';
import Section from './ui/Section';
import CategoryIcon from './ui/CategoryIcon';

export default function CategoriesSection() {
  const t = useTranslations('categories');
  const { selectedFilter, setSelectedFilter } = useAppContext();
  return <Section id="insurance-types" eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} className="categories-section">
    <div className="category-grid">{CATEGORY_SLUGS.map(slug => <button type="button" className="category-card" key={slug} aria-pressed={selectedFilter === slug} onClick={() => { setSelectedFilter(slug); focusSection('company-list'); }}>
      <span className="category-icon"><CategoryIcon category={slug} /></span>
      <span className="category-name">{t(`items.${slug}`)}</span>
      <span className="category-description">{t(`descriptions.${slug}`)}</span>
      <FaArrowUpRightFromSquare className="category-arrow" aria-hidden="true" />
    </button>)}</div>
  </Section>;
}
