"use client";

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  fallback: ReactNode;
}
export default function AssetImage({ src, alt, className = '', sizes, priority = false, fallback }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const safeSrc = src && (src.startsWith('/') && !src.startsWith('//') || /^https:\/\/s3\.mcins\.la\//.test(src));
  return <div className={`asset-frame ${className}`}>
    {safeSrc && failedSrc !== src
      ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailedSrc(src)} />
      : <span className="asset-placeholder" aria-hidden="true">{fallback}</span>}
  </div>;
}
