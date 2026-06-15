'use client';

import { useBusinessPublic, useBusinessProducts, useBusinessServices, useBusinessMenu, useBusinessRooms, useBusinessEvents, useBusinessRentals, useBusinessPortfolio, useBusinessPromotions, useBusinessPartners, useBusinessReviews, useBusinessBookings, useBusinessTrainings } from '@/features/hooks';
import { useBusinessStories } from '@/hooks/features/useStories';
import { useShorts } from '@/hooks/features/useShorts';
import { useActiveLives } from '@/hooks/features/useLives';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Navbar } from './Navbar';
import { Banner } from './Banner';
import { Header } from './Header';
import { InternalNav } from './InternalNav';
import { Accueil } from './sections/Accueil';
import { Products } from './sections/Products';
import { Services } from './sections/Services';
import { Menu } from './sections/Menu';
import { Rooms } from './sections/Rooms';
import { Bookings } from './sections/Bookings';
import { Events } from './sections/Events';
import { Rentals } from './sections/Rentals';
import { Portfolio } from './sections/Portfolio';
import { Promotions } from './sections/Promotions';
import { Partners } from './sections/Partners';
import { Reviews } from './sections/Reviews';
import { Trainings } from './sections/Trainings';
import { FAQ } from './sections/FAQ';
import { Contact } from './sections/Contact';
import { Sidebar } from './sections/Sidebar';
import { Footer } from './Footer';
import { ErrorState } from './ErrorState';
import { MediaStories } from './sections/MediaStories';
import { MediaShorts } from './sections/MediaShorts';
import { LiveBanner } from './sections/LiveBanner';
import { BusinessModule } from '@/types/business';
import { PageViewTracker } from '@/components/customer360/PageViewTracker';
import { AdBannerCarousel } from '@/components/ads/AdBannerCarousel';
import AdSlot from '@/components/ads/AdSlot';
import { BusinessStats } from './BusinessStats';

interface BusinessPageProps {
  slug: string;
}

export function BusinessPage({ slug }: BusinessPageProps) {
  const { data: business, isLoading, error } = useBusinessPublic(slug);

  const modules: BusinessModule[] = business?.modules || [];

  const { data: products } = useBusinessProducts(slug, { enabled: modules.includes('PRODUCTS') && !!business });
  const { data: services } = useBusinessServices(slug, { enabled: modules.includes('SERVICES') && !!business });
  const { data: menu } = useBusinessMenu(slug, { enabled: modules.includes('MENU') && !!business });
  const { data: rooms } = useBusinessRooms(slug, { enabled: modules.includes('ROOMS') && !!business });
  const { data: events } = useBusinessEvents(slug, { enabled: modules.includes('EVENTS') && !!business });
  const { data: rentals } = useBusinessRentals(slug, { enabled: modules.includes('RENTALS') && !!business });
  const { data: portfolio } = useBusinessPortfolio(slug, { enabled: modules.includes('PORTFOLIO') && !!business });
  const { data: promotions } = useBusinessPromotions(slug, { enabled: modules.includes('PROMOTIONS') && !!business });
  const { data: partners } = useBusinessPartners(slug, { enabled: modules.includes('PARTNERS') && !!business });
  const { data: reviews } = useBusinessReviews(slug, { enabled: !!business });
  const { data: trainings } = useBusinessTrainings(slug, { enabled: modules.includes('TRAINING') && !!business });

  const { data: stories } = useBusinessStories(business?.id || '');
  const { data: shortsData } = useShorts({ businessId: business?.id, limit: 1 });
  const { data: livesData } = useActiveLives({ businessId: business?.id, status: 'LIVE' });

  const hasStories = !!stories && stories.length > 0;
  const hasShorts = (shortsData?.items?.length || 0) > 0;
  const hasActiveLive = (livesData?.items?.length || 0) > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-48 sm:h-64 lg:h-80 bg-gray-200 dark:bg-gray-700" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-end gap-4 sm:gap-6 -mt-20 sm:-mt-24 mb-8">
              <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return <ErrorState />;
  }

  const hasSidebar = business.hours?.length > 0 || business.paymentMethods?.length > 0 || business.deliveryZones?.length > 0 || business.address || business.phone || business.email || business.website;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PageViewTracker businessId={business.id} />
      <Navbar />
      <Banner business={business} />
      <Header business={business} />

{hasActiveLive && <LiveBanner businessId={business.id} />}
      <InternalNav modules={modules} hasStories={hasStories} hasShorts={hasShorts} hasActiveLive={hasActiveLive} />

      {/* Ad Banner Carousel - scrollable ads */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AdBannerCarousel country={business.country || undefined} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex flex-col lg:flex-row gap-8`}>
          <div className={`flex-1 min-w-0 ${hasSidebar ? '' : 'max-w-4xl mx-auto'}`}>
            <ErrorBoundary>
              <section id="section-accueil">
                <Accueil business={business} />
              </section>

              {/* Business Stats - animated counters */}
              <div className="my-6">
                <BusinessStats business={business} productsCount={products?.length || 0} servicesCount={services?.length || 0} />
              </div>

              {/* Inline Ad placement */}
              <div className="my-6">
                <AdSlot page="BUSINESS_PUBLIC_PAGE" position="PROMO_WIDGET" country={business.country || undefined} />
              </div>
            </ErrorBoundary>
            <ErrorBoundary>
              <MediaStories businessId={business.id} businessName={business.name} businessSlug={slug} businessLogo={business.logo} />
            </ErrorBoundary>
            <ErrorBoundary>
              <MediaShorts businessId={business.id} businessSlug={slug} />
            </ErrorBoundary>
            <ErrorBoundary>{modules.includes('PRODUCTS') && <Products businessId={business.id} products={products || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('SERVICES') && <Services services={services || []} businessSlug={slug} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('MENU') && <Menu categories={menu?.categories || []} uncategorized={menu?.uncategorized || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('ROOMS') && <Rooms rooms={rooms || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('BOOKINGS') && <Bookings whatsapp={business.whatsapp || undefined} businessName={business.name} slug={slug} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('EVENTS') && <Events events={events || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('RENTALS') && <Rentals rentals={rentals || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('PORTFOLIO') && <Portfolio items={portfolio || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('PROMOTIONS') && <Promotions promotions={promotions || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('PARTNERS') && <Partners partners={partners || []} />}</ErrorBoundary>
            <ErrorBoundary>{modules.includes('TRAINING') && <Trainings trainings={trainings || []} businessSlug={slug} />}</ErrorBoundary>
            <ErrorBoundary>
              <section id="section-faq">
                <FAQ />
              </section>
            </ErrorBoundary>
            <ErrorBoundary>
              <section id="section-contact">
                <Contact business={business} />
              </section>
            </ErrorBoundary>
            <ErrorBoundary>
              <section id="section-reviews">
                <Reviews reviews={reviews || []} />
              </section>
            </ErrorBoundary>
          </div>
          {hasSidebar && (
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="lg:sticky lg:top-32">
                <ErrorBoundary><Sidebar business={business} /></ErrorBoundary>
                
                {/* Sidebar Ad */}
                <div className="mt-6">
                  <AdSlot page="BUSINESS_PUBLIC_PAGE" position="SIDEBAR" country={business.country || undefined} dismissible />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer business={business} />
    </div>
  );
}
