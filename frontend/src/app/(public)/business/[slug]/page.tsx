import { Metadata } from 'next';
import { BusinessPageClient } from './BusinessPageClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${baseUrl}/business/${slug}/public`, { next: { revalidate: 60 } });
    const json = await res.json();
    const business = json?.data;
    if (business) {
      return {
        title: `${business.name} - AfriBiz`,
        description: business.shortDescription || business.description || `Découvrez ${business.name} sur AfriBiz`,
        openGraph: {
          title: business.name,
          description: business.shortDescription || '',
          images: business.logo ? [{ url: business.logo }] : [],
        },
      };
    }
  } catch (e) { console.error(e); }
  return { title: 'Business - AfriBiz' };
}

function JsonLd({ business }: { business: Record<string, unknown> }) {
  const b = business as unknown as {
    name: string; shortDescription?: string; description?: string; slug: string;
    logo?: string; coverImage?: string; phone?: string; email?: string;
    address?: string; city?: string; region?: string; country?: string;
    latitude?: number; longitude?: number; rating?: number; reviewCount?: number;
    facebook?: string; instagram?: string; twitter?: string;
    linkedin?: string; youtube?: string; tiktok?: string;
    hours?: Array<{ day: number; open?: string; close?: string }>;
  };
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    description: b.shortDescription || b.description || '',
    image: b.logo || b.coverImage || '',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/business/${b.slug}`,
    telephone: b.phone || '',
    email: b.email || '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.address || '',
      addressLocality: b.city || '',
      addressRegion: b.region || '',
      addressCountry: b.country || '',
    },
    geo: b.latitude && b.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: b.latitude,
      longitude: b.longitude,
    } : undefined,
    aggregateRating: b.reviewCount && b.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: b.rating || 0,
      reviewCount: b.reviewCount || 0,
    } : undefined,
    openingHours: b.hours?.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][h.day]}`,
      opens: h.open || '00:00',
      closes: h.close || '00:00',
    })),
    sameAs: [
      b.facebook, b.instagram, b.twitter,
      b.linkedin, b.youtube, b.tiktok,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  let business = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${baseUrl}/business/${slug}/public`, { next: { revalidate: 60 } });
    const json = await res.json();
    business = json?.data;
  } catch { /* ignore */ }

  return (
    <>
      {business && <JsonLd business={business} />}
      <BusinessPageClient slug={slug} />
    </>
  );
}
