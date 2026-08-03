import { Metadata } from 'next';
import { BusinessPageClient } from './BusinessPageClient';
import { getApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewCount: number;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  hours?: Array<{ day: number; open?: string; close?: string }>;
  modules?: string[];
  tags?: string[];
  category?: string;
  paymentMethods?: Array<{ id: string; method: string; name?: string; number?: string }>;
  deliveryZones?: Array<{ id: string; name: string; fee: number; minOrder?: number }>;
  isVerified?: boolean;
  isPremium?: boolean;
  isNew?: boolean;
  isTopSeller?: boolean;
  isTopProvider?: boolean;
  isRecommended?: boolean;
  [key: string]: unknown;
}

async function fetchBusiness(slug: string): Promise<BusinessData | null> {
  try {
    const res = await fetch(getApiUrl(`/business/${slug}/public`), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    console.error('Failed to fetch business:', e);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug);
  if (business) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';
    const metaTitle = business.seoTitle || `${business.name} - AfriBiz`;
    const metaDesc =
      business.seoDescription ||
      business.shortDescription ||
      business.description ||
      `Découvrez ${business.name} sur AfriBiz`;
    return {
      title: metaTitle,
      description: metaDesc,
      keywords: [
        business.category,
        business.type,
        business.city,
        business.country,
        'Afrique',
        'business',
      ]
        .filter(Boolean)
        .join(', '),
      robots: { index: true, follow: true },
      openGraph: {
        title: metaTitle,
        description: metaDesc,
        images: business.logo
          ? [{ url: business.logo, width: 800, height: 800, alt: business.name }]
          : [],
        type: 'website',
        locale: 'fr_FR',
        siteName: 'AfriBiz',
      },
      alternates: {
        canonical: `${siteUrl}/business/${business.slug}`,
      },
    };
  }
  return { title: 'Business - AfriBiz', robots: { index: false, follow: false } };
}

function JsonLd({ business }: { business: BusinessData }) {
  const b = business;
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
    geo:
      b.latitude && b.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: b.latitude,
            longitude: b.longitude,
          }
        : undefined,
    aggregateRating:
      b.reviewCount && b.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: b.rating || 0,
            reviewCount: b.reviewCount || 0,
          }
        : undefined,
    openingHours: b.hours?.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.day]}`,
      opens: h.open || '00:00',
      closes: h.close || '00:00',
    })),
    sameAs: [b.facebook, b.instagram, b.twitter, b.linkedin, b.youtube, b.tiktok].filter(Boolean),
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
  const business = await fetchBusiness(slug);

  return (
    <>
      {business && <JsonLd business={business} />}
      <BusinessPageClient slug={slug} initialData={business} />
    </>
  );
}
