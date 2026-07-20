import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs - AfriBiz',
  description:
    'Découvrez nos offres et abonnements AfriBiz. Des solutions adaptées aux entrepreneurs, TPE et grandes entreprises africaines.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
