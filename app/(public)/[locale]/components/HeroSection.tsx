"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa6";
import { useTranslations, useLocale } from "next-intl";
import { poppins, inter } from "../fonts";
import Button from "./ui/Button";

const FALLBACK_BANNERS = [
    "https://s3.mcins.la/mcins/banners/banner-bg.jpg",
];

interface HeroContent {
    title: string;
    subtitle: string;
}

interface Banner {
    id: string;
    imageUrl: string;
    linkUrl: string | null;
}

export default function HeroSection() {
    const t = useTranslations("hero");
    const tHome = useTranslations("home.cta");
    const locale = useLocale();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [banners, setBanners] = useState<Banner[]>(
        FALLBACK_BANNERS.map((url, i) => ({ id: `fallback-${i}`, imageUrl: url, linkUrl: null }))
    );
    const [heroContent, setHeroContent] = useState<HeroContent>({
        title: t('title'),
        subtitle: t('subtitle')
    });

    useEffect(() => {
        setIsLoaded(true);

        const fetchHeroSettings = async () => {
            try {
                const response = await fetch(`/api/settings?prefix=hero_&locale=${locale}`);
                const result = await response.json();

                if (result.success && result.data) {
                    setHeroContent({
                        title: result.data.hero_title || t('title'),
                        subtitle: result.data.hero_subtitle || t('subtitle')
                    });
                }
            } catch (error) {
                console.error('Error fetching hero settings:', error);
            }
        };

        const fetchBanners = async () => {
            try {
                const response = await fetch('/api/banners');
                const result = await response.json();
                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    setBanners(result.data);
                    setCurrentIndex(0);
                }
            } catch (error) {
                console.error('Error fetching banners:', error);
            }
        };

        fetchHeroSettings();
        fetchBanners();
    }, [locale, t]);

    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const goToPrevious = () => {
        if (banners.length <= 1) return;
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? banners.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        if (banners.length <= 1) return;
        setCurrentIndex((prevIndex) =>
            prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="relative w-full h-[520px] md:h-[580px] lg:h-[640px] overflow-hidden group">
            <div className="relative w-full h-full">
                {banners.map((banner, index) => {
                    const image = (
                        <Image
                            src={banner.imageUrl}
                            alt={`Banner ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                        />
                    );
                    return (
                        <div
                            key={banner.id}
                            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                                index === currentIndex ? "opacity-100" : "opacity-0"
                            }`}
                        >
                            {banner.linkUrl ? (
                                <a href={banner.linkUrl} className="block w-full h-full">
                                    {image}
                                </a>
                            ) : (
                                image
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-slate-950/20 z-1" />
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-slate-50 z-1" />
                        </div>
                    );
                })}
            </div>

            <div className={`absolute inset-0 flex flex-col items-start justify-center z-10 text-white px-6 md:px-12 lg:px-24 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="max-w-3xl">
                    <h1
                        className={`${poppins.className} text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight drop-shadow-lg`}
                    >
                        {heroContent.title}
                    </h1>
                    <div className="h-1.5 w-20 bg-gradient-to-r from-secondary to-accent rounded-full shadow-lg mb-5"></div>
                    <p
                        className={`${inter.className} text-lg md:text-xl lg:text-2xl font-light tracking-wide drop-shadow-md max-w-2xl leading-relaxed mb-8`}
                    >
                        {heroContent.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button href="#company-list" variant="secondary" size="lg">
                            {tHome("primary")}
                            <FaArrowRight size={14} />
                        </Button>
                        <Button href="#how-it-works" variant="ghost" size="lg">
                            {tHome("secondary")}
                        </Button>
                    </div>
                </div>
            </div>

            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-primary/80 text-white p-3 md:p-4 rounded-full transition-all duration-300 z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-[-20px] group-hover:translate-x-0"
                        aria-label="Previous slide"
                    >
                        <FaChevronLeft size={18} />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-primary/80 text-white p-3 md:p-4 rounded-full transition-all duration-300 z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-[20px] group-hover:translate-x-0"
                        aria-label="Next slide"
                    >
                        <FaChevronRight size={18} />
                    </button>

                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                                    index === currentIndex
                                        ? "bg-accent w-10"
                                        : "bg-white/60 hover:bg-white w-2.5"
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
