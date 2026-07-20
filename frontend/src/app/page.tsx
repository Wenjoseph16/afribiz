import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import AdSlot from '@/components/ads/AdSlot';
import { HeroSection } from '@/components/home/HeroSection';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { BusinessCarousel } from '@/components/home/BusinessCarousel';
import { ModulesGridSection } from '@/components/home/ModulesGridSection';
import { DeveloperSection } from '@/components/home/DeveloperSection';
import { PricingSection } from '@/components/home/PricingSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FAQSection } from '@/components/home/FAQSection';
import { CTASection } from '@/components/home/CTASection';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header />
      <AdSlot page="HOMEPAGE" position="POPUP" dismissible />
      <HeroSection />
      <SocialProofSection />
      <BusinessCarousel />
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <AdSlot page="HOMEPAGE" position="TOP_BANNER" />
      </section>
      <ModulesGridSection />
      <DeveloperSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <AdSlot page="HOMEPAGE" position="BOTTOM_BANNER" />
      </div>
      <Footer />
    </main>
  );
}
