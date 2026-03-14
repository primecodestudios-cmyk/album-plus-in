import { Navbar } from "@/components/landing/Navbar";
import { HeroSlider } from "@/components/landing/HeroSlider";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BonusSection } from "@/components/landing/BonusSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSlider />
        <FeaturesSection />
        <BonusSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
