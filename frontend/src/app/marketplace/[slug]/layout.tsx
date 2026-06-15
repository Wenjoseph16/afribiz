import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getModule(slug: string) {
  try {
    const res = await fetch(`${API_URL}/marketplace/modules/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const mod = await getModule(slug);

  if (!mod) {
    return {
      title: 'Module introuvable — Marketplace AfriBiz',
      description: 'Ce module n\'existe pas ou a été retiré du marketplace.',
    };
  }

  const title = `${mod.name} — Modules & Extensions AfriBiz`;
  const description = mod.shortDescription || mod.description || `Découvrez le module ${mod.name} sur le marketplace AfriBiz.`;

  return {
    title,
    description,
    keywords: [
      mod.name, mod.category || '', 'module afribiz', 'extension business',
      'marketplace développeur', 'application afrique',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/marketplace/${slug}`,
      siteName: 'AfriBiz',
      type: 'article',
      images: mod.logo ? [{ url: mod.logo, width: 256, height: 256 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mod.logo ? [mod.logo] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/marketplace/${slug}`,
    },
  };
}

function ModuleJsonLd({ mod }: { mod: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: mod.name,
    description: mod.shortDescription || mod.description || '',
    url: `${BASE_URL}/marketplace/${mod.slug}`,
    applicationCategory: mod.category || 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: mod.pricingType === 'FREE' || mod.isFree ? '0' : String(Number(mod.price) || 0),
      priceCurrency: mod.currency || 'XOF',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Organization',
      name: mod.developer?.companyName || 'Développeur AfriBiz',
    },
    aggregateRating: mod.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(mod.rating).toFixed(1),
          reviewCount: mod.reviewCount || 0,
        }
      : undefined,
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'Modules & Extensions — Marketplace AfriBiz',
      url: `${BASE_URL}/marketplace/modules`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function ModuleDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = await getModule(slug);

  return (
    <>
      {mod && <ModuleJsonLd mod={mod} />}
      {children}
    </>
  );
}
