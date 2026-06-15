import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import MarketplaceContent from '@/components/marketplace/MarketplaceContent';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Marketplace AfriBiz — Découvrez les meilleurs business d\'Afrique',
    description:
      'Explorez la marketplace AfriBiz : trouvez des business, produits, services et événements près de chez vous. Recherchez, filtrez, comparez et connectez-vous aux meilleurs prestataires africains.',
    keywords: [
      'marketplace afrique', 'business africain', 'produits afrique',
      'services afrique', 'AfriBiz', 'commerce afrique',
      'entreprises lomé', 'entreprises cotonou', 'marketplace tchad',
    ],
    openGraph: {
      title: 'Marketplace AfriBiz — Les meilleurs business d\'Afrique',
      description:
        'Explorez la marketplace AfriBiz : trouvez des business, produits, services et événements près de chez vous.',
      url: `${BASE_URL}/marketplace`,
      siteName: 'AfriBiz',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Marketplace AfriBiz',
      description:
        'Trouvez les meilleurs business, produits et services en Afrique.',
    },
    alternates: {
      canonical: `${BASE_URL}/marketplace`,
    },
  };
}

function MarketplaceJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Marketplace AfriBiz',
    description:
      'Explorez la marketplace AfriBiz : trouvez des business, produits, services et événements près de chez vous.',
    url: `${BASE_URL}/marketplace`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'AfriBiz',
      url: BASE_URL,
    },
    about: {
      '@type': 'Organization',
      name: 'AfriBiz',
    },
    provider: {
      '@type': 'Organization',
      name: 'AfriBiz',
      url: BASE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/marketplace?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function MarketplacePage() {
  return (
    <>
      <MarketplaceJsonLd />
      <Header />
      <main className="pt-16">
        <MarketplaceContent />
      </main>
      <Footer />
    </>
  );
}
