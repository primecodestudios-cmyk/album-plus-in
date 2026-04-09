import { Navbar } from "@/components/landing/Navbar";
import { LimitedTimeBanner } from "@/components/landing/LimitedTimeBanner";
import { HeroSlider } from "@/components/landing/HeroSlider";
import { IntroVideoSection } from "@/components/landing/IntroVideoSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SmartFeaturesSection } from "@/components/landing/SmartFeaturesSection";
import { CustomerStatsSection } from "@/components/landing/CustomerStatsSection";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { BonusSection } from "@/components/landing/BonusSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PlatformSection } from "@/components/landing/PlatformSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ExitPopup } from "@/components/landing/ExitPopup";
import { useAppSettings } from "@/hooks/useAppSettings";

const Index = () => {
  const { settings, loading } = useAppSettings();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LimitedTimeBanner />
      <main>
        <HeroSlider />
        <IntroVideoSection />
        <FeaturesSection />
        <SmartFeaturesSection />
        <CustomerStatsSection />
        <BeforeAfterSection />
        <DemoVideoSection />
        <TestimonialsSection />
        <BonusSection />
        <PricingSection />
        <PlatformSection />
        <CTASection />
      </main>
      <Footer />
      
      {!loading && settings.enable_chat_widget && <ChatWidget />}
      {!loading && settings.enable_whatsapp_button && (
        <WhatsAppButton phoneNumber={settings.support_phone} />
      )}
      <ExitPopup />
    </div>
  );
};

export default Index;
