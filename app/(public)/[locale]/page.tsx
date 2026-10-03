import { Suspense } from 'react';
import HeroSection from './components/HeroSection';
import HomeCatalog from './components/HomeCatalog';
import { CatalogSkeleton } from './components/CompanyListSection';
import HowItWorksSection from './components/HowItWorksSection';
import FaqSection from './components/FaqSection';
import CtaBand from './components/CtaBand';
import MobileAdvisorBar from './components/MobileAdvisorBar';
export default function Home() {
  return <div className="homepage">
    <HeroSection />
    <Suspense fallback={<div className="site-section site-container"><CatalogSkeleton /></div>}><HomeCatalog /></Suspense>
    <HowItWorksSection />
    <FaqSection />
    <CtaBand />
    <MobileAdvisorBar />
  </div>;
}
