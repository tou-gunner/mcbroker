import HeroSection from "./components/HeroSection";
import CompanyListSection from "./components/CompanyListSection";

export default function Home() {
  return (<>
    <HeroSection />
    <div>
      <section id="company-list">
        <CompanyListSection />
      </section>
    </div>
  </>);
}