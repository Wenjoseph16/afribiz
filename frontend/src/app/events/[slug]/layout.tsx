import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Événements - AfriBiz',
  description:
    'Découvrez les événements professionnels et culturels près de chez vous sur AfriBiz.',
};

export default function EventsSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
