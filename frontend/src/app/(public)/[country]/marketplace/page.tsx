import { Metadata } from 'next';
import CountryMarketplaceClient from './client';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';

const COUNTRY_NAMES: Record<string, string> = {
  TG: 'Togo',
  BJ: 'Bénin',
  GH: 'Ghana',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  SN: 'Sénégal',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const code = country.toUpperCase();
  const name = COUNTRY_NAMES[code] || country;
  return {
    title: `Marketplace ${name} - AfriBiz`,
    description: `Découvrez les meilleurs business, produits et services au ${name} sur AfriBiz.`,
    keywords: [
      `marketplace ${name.toLowerCase()}`,
      `business ${name.toLowerCase()}`,
      `produits ${name.toLowerCase()}`,
      `services ${name.toLowerCase()}`,
      'AfriBiz',
      `entreprises ${name.toLowerCase()}`,
    ],
    openGraph: {
      title: `Marketplace ${name} — AfriBiz`,
      description: `Découvrez les meilleurs business, produits et services au ${name}.`,
      url: `${BASE_URL}/${country.toLowerCase()}/marketplace`,
      siteName: 'AfriBiz',
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/${country.toLowerCase()}/marketplace`,
    },
  };
}

export default async function CountryMarketplacePage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  return <CountryMarketplaceClient countryCode={country.toUpperCase()} />;
}
