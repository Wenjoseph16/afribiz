import { Metadata } from 'next';
import CountryMarketplaceClient from './client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';

const COUNTRY_NAMES: Record<string, string> = {
  TG: 'Togo',
  BJ: 'Bénin',
  GH: 'Ghana',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  SN: 'Sénégal',
};

export async function generateMetadata({ params }: { params: { country: string } }): Promise<Metadata> {
  const code = params.country.toUpperCase();
  const name = COUNTRY_NAMES[code] || params.country;
  return {
    title: `Marketplace ${name} - AfriBiz`,
    description: `Découvrez les meilleurs business, produits et services au ${name} sur AfriBiz.`,
    keywords: [
      `marketplace ${name.toLowerCase()}`, `business ${name.toLowerCase()}`,
      `produits ${name.toLowerCase()}`, `services ${name.toLowerCase()}`,
      'AfriBiz', `entreprises ${name.toLowerCase()}`,
    ],
    openGraph: {
      title: `Marketplace ${name} — AfriBiz`,
      description: `Découvrez les meilleurs business, produits et services au ${name}.`,
      url: `${BASE_URL}/${params.country.toLowerCase()}/marketplace`,
      siteName: 'AfriBiz',
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/${params.country.toLowerCase()}/marketplace`,
    },
  };
}

export default function CountryMarketplacePage({ params }: { params: { country: string } }) {
  return <CountryMarketplaceClient countryCode={params.country.toUpperCase()} />;
}
