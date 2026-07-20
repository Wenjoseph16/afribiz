import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modules - AfriBiz Marketplace',
  description:
    'Explorez tous les modules disponibles sur AfriBiz Marketplace. Solutions pour entrepreneurs et développeurs.',
};

export default function MarketplaceModulesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
