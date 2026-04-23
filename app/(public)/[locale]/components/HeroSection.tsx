"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Poppins, Inter } from "next/font/google";
import { useTranslations, useLocale } from "next-intl";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600", "700", "800"],
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["300", "400", "500"],
    display: "swap",
});

const banners = [
    "/banners/banner-bg.jpg",
    // "/banners/ins-banner1.jpg",
    // "/banners/ins-banner2.jpg",
];

interface HeroContent {
    title: string;
    subtitle: string;
}

export default function HeroSection() {
    const t = useTranslations("hero");
    const locale = useLocale();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [heroContent, setHeroContent] = useState<HeroContent>({
        title: t('title'),
        subtitle: t('subtitle')
    });

    useEffect(() => {
        setIsLoaded(true);
        
        // Fetch hero settings from API
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
                // Keep default translations on error
            }
        };

        fetchHeroSettings();
    }, [locale, t]);

    // Auto-play functionality
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

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
        <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden group">
            {/* Carousel Images */}
            <div className="relative w-full h-full">
                {banners.map((banner, index) => (
                    <div
                        key={index}
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                            index === currentIndex ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        <div className="absolute inset-0 bg-black/20 z-1" /> {/* Simple overlay for contrast */}
                            <Image
                                src={banner}
                                alt={`Banner ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                style={{
                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0) 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0) 100%)'
                                }}
                            />
                    </div>
                ))}
            </div>

            {/* Overlay Text */}
            <div className={`absolute inset-0 flex flex-col items-start justify-center z-10 text-white px-6 md:px-12 lg:px-24 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h1 
                    className={`${poppins.className} text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg`}
                >
                    {heroContent.title}
                </h1>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-1.5 w-24 bg-linear-to-r from-secondary to-orange-500 rounded-full shadow-lg"></div>
                </div>
                <p 
                    className={`${inter.className} text-xl md:text-2xl lg:text-3xl font-light tracking-wide drop-shadow-md max-w-2xl leading-relaxed`}
                >
                    {heroContent.subtitle}
                </p>
            </div>

            {/* Navigation Controls - Only show if more than 1 banner */}
            {banners.length > 1 && (
                <>
                    <button
                onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-primary/80 text-white p-3 md:p-4 rounded-full transition-all duration-300 z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-[-20px] group-hover:translate-x-0"
                aria-label="Previous slide"
            >
                <FaChevronLeft size={20} />
                    </button>

                    <button
                onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-primary/80 text-white p-3 md:p-4 rounded-full transition-all duration-300 z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-[20px] group-hover:translate-x-0"
                aria-label="Next slide"
            >
                <FaChevronRight size={20} />
                    </button>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                                className={`h-3 rounded-full transition-all duration-300 shadow-sm ${
                            index === currentIndex
                                        ? "bg-secondary w-10"
                                        : "bg-white/60 hover:bg-white w-3"
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
