import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Module développeur - AfriBiz Marketplace',
  description:
    'Découvrez les modules développeurs sur AfriBiz Marketplace. Fonctionnalités, avis, prix et installation.',
};

export default function MarketplaceSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
