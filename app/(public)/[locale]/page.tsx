import HeroSection from "./components/HeroSection";
import WhyBrokerStrip from "./components/WhyBrokerStrip";
import CategoriesSection from "./components/CategoriesSection";
import CompanyListSection from "./components/CompanyListSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FaqSection from "./components/FaqSection";
import CtaBand from "./components/CtaBand";

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="bg-slate-50 pb-10 md:pb-16">
        <WhyBrokerStrip />
      </div>
      <CategoriesSection />
      <CompanyListSection />
      <HowItWorksSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
