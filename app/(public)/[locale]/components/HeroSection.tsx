"use client";
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FaArrowRight, FaHouse, FaShieldHeart } from 'react-icons/fa6';
import { bannerLink } from '@/app/utils/contact';
import Button from './ui/Button';
import AssetImage from './ui/AssetImage';

interface Banner { id: string; imageUrl: string; linkUrl: string | null }
export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations('hero');
  const cta = useTranslations('home.cta');
  const [content, setContent] = useState<{ locale: string; title?: string; subtitle?: string }>();
  const [banner, setBanner] = useState<Banner>();
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/settings?prefix=hero_&locale=${locale}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && !controller.signal.aborted) setContent({ locale, title: data.data?.hero_title, subtitle: data.data?.hero_subtitle });
      } catch { /* Localized copy remains visible when settings are unavailable. */ }
    }
    void load();
    return () => controller.abort();
  }, [locale]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/banners', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && Array.isArray(data.data) && !controller.signal.aborted) setBanner(data.data[0]);
      } catch { /* Use the neutral artwork placeholder. */ }
    }
    void load();
    return () => controller.abort();
  }, []);
  const current = content?.locale === locale ? content : undefined;
  const featureLink = bannerLink(banner?.linkUrl ?? null);
  return <section className="hero-section" aria-labelledby="hero-title">
    <div className="site-container hero-grid">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow"><span aria-hidden="true" />{t('eyebrow')}</p>
        <h1 id="hero-title">{current?.title || t('title')}</h1>
        <p className="hero-description">{current?.subtitle || t('subtitle')}</p>
        <div className="hero-actions"><Button href="#insurance-types">{cta('primary')}<FaArrowRight aria-hidden="true" /></Button><Button href="#contact" variant="secondary">{cta('secondary')}</Button></div>
        <p className="hero-note"><FaShieldHeart aria-hidden="true" />{t('note')}</p>
      </div>
      <div className="hero-artwork">
        <div className="hero-artwork-frame">
          <AssetImage key={banner?.id ?? 'placeholder'} src={banner?.imageUrl} alt="" className="hero-image" sizes="(min-width: 1280px) 560px, (min-width: 1024px) 46vw, 90vw" priority fallback={<span className="hero-placeholder-scene"><span className="placeholder-orbit" /><FaHouse /><span className="placeholder-shield"><FaShieldHeart /></span></span>} />
          <div className="hero-image-caption"><span className="caption-icon"><FaShieldHeart aria-hidden="true" /></span><div><span className="caption-label">{t('artLabel')}</span><strong>{t('artTitle')}</strong></div></div>
        </div>
        {featureLink && <Button href={featureLink} variant="ghost" external={/^https?:/.test(featureLink)}>{t('featured')}<FaArrowRight aria-hidden="true" /></Button>}
      </div>
    </div>
  </section>;
}
