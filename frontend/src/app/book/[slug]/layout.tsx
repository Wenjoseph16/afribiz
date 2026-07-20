import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réservation - AfriBiz',
  description: 'Réservez un service ou un créneau sur AfriBiz en toute simplicité.',
};

export default function BookSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
