import { Navbar } from "@/components/landing/Navbar";
import { LimitedTimeBanner } from "@/components/landing/LimitedTimeBanner";
import { HeroSlider } from "@/components/landing/HeroSlider";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SmartFeaturesSection } from "@/components/landing/SmartFeaturesSection";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { BonusSection } from "@/components/landing/BonusSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PlatformSection } from "@/components/landing/PlatformSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { ExitPopup } from "@/components/landing/ExitPopup";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LimitedTimeBanner />
      <main>
        <HeroSlider />
        <FeaturesSection />
        <SmartFeaturesSection />
        <BeforeAfterSection />
        <DemoVideoSection />
        <TestimonialsSection />
        <BonusSection />
        <PricingSection />
        <PlatformSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
      <ExitPopup />
    </div>
  );
};

export default Index;
