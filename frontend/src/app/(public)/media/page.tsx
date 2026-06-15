import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MediaPageClient } from './MediaPageClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://afribiz.com';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AfriBiz Media — Découvrez, achetez, réservez en vidéo',
    description:
      'Explorez AfriBiz Media : stories, shorts, lives commerce, offres flash. Découvrez des produits et services en vidéo, achetez et réservez directement depuis le contenu.',
    keywords: [
      'AfriBiz media', 'stories business', 'shorts commerce', 'live shopping',
      'live commerce afrique', 'offres flash', 'vidéo produit', 'achat vidéo',
      'marketplace vidéo', 'réserver en ligne',
    ],
    openGraph: {
      title: 'AfriBiz Media — Le commerce vidéo en Afrique',
      description: 'Découvrez des produits et services en vidéo. Stories, shorts, lives et offres flash.',
      url: `${BASE_URL}/media`,
      siteName: 'AfriBiz',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AfriBiz Media',
      description: 'Le commerce vidéo en Afrique. Stories, shorts, lives et offres flash.',
    },
  };
}

export default function MediaPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16">
        <MediaPageClient />
      </main>
      <Footer />
    </>
  );
}
