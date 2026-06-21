import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import TrustBar from "@/components/sections/TrustBar";
import ProblemSection from "@/components/sections/ProblemSection";
import HowFraudModelWorks from "@/components/sections/HowFraudModelWorks";
import DemoSection from "@/components/sections/DemoSection";
import ComparisonTable from "@/components/sections/ComparisonTable";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import EmotionalAnchor from "@/components/sections/EmotionalAnchor";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TrustBar />
      <ProblemSection />
      <HowFraudModelWorks />
      <DemoSection />
      <ComparisonTable />
      <HowItWorksSection />
      <EmotionalAnchor />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
