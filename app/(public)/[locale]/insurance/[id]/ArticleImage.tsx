"use client";

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FaImage } from 'react-icons/fa6';

export default function ArticleImage({ src, alt = '', width, height, title, id }: { src: string; alt?: string; width?: number; height?: number; title?: string; id?: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  // An SSR image may fail before hydration attaches onError.
  const attachImage = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) setFailedSrc(src);
  }, [src]);
  const t = useTranslations('insurance');
  return failedSrc === src ? <span id={id} className="article-image-fallback" role="img" aria-label={alt || t('imageUnavailable')}><FaImage aria-hidden="true" /><span>{t('imageUnavailable')}{alt ? ` — ${alt}` : ''}</span></span>
    // CMS articles can reference arbitrary HTTPS images; preserve their original proportions.
    // eslint-disable-next-line @next/next/no-img-element
    : <img ref={attachImage} id={id} src={src} alt={alt} width={width} height={height} title={title} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />;
}
