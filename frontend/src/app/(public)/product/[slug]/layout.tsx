import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const productName = slug.replace(/-/g, ' ');
  return {
    title: `${productName} | AfriBiz Marketplace`,
    description: `Découvrez ${productName} sur AfriBiz. Prix, avis et informations détaillées.`,
    openGraph: {
      title: `${productName} | AfriBiz Marketplace`,
      description: `Découvrez ${productName} sur AfriBiz.`,
      type: 'website',
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
