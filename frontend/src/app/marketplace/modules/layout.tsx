import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';

export const metadata: Metadata = {
  title: 'Modules & Extensions — Marketplace AfriBiz',
  description:
    'Découvrez des modules développés par la communauté AfriBiz pour étendre les fonctionnalités de votre business. Marketplace développeur AfriBiz.',
  keywords: [
    'modules afribiz', 'extensions business', 'marketplace développeur',
    'applications afrique', 'plugins crm', 'ecommerce afrique',
    'développeur africain', 'api business',
  ],
  openGraph: {
    title: 'Modules & Extensions — Marketplace AfriBiz',
    description:
      'Découvrez des modules développés par la communauté AfriBiz pour étendre les fonctionnalités de votre business.',
    url: `${BASE_URL}/marketplace/modules`,
    siteName: 'AfriBiz',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Modules & Extensions — Marketplace AfriBiz',
    description:
      'Découvrez des modules développés par la communauté AfriBiz.',
  },
  alternates: {
    canonical: `${BASE_URL}/marketplace/modules`,
  },
};

function ModulesJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Modules & Extensions — Marketplace AfriBiz',
    description:
      'Découvrez des modules développés par la communauté AfriBiz pour étendre les fonctionnalités de votre business.',
    url: `${BASE_URL}/marketplace/modules`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'AfriBiz',
      url: BASE_URL,
    },
    about: {
      '@type': 'Organization',
      name: 'AfriBiz',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModulesJsonLd />
      {children}
    </>
  );
}
