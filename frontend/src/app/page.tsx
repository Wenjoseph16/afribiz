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
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header />
      <AdSlot page="HOMEPAGE" position="POPUP" dismissible />
      <HeroSection />
      <section className="border-y border-emerald-100 bg-emerald-50/70 px-4 py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Un socle prêt à convertir
            </div>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
              La plateforme combine découverte, ventes, réservations et paiements pour donner à
              chaque business une vraie trajectoire de croissance.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Ouvrir mon espace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
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
