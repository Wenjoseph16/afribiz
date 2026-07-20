import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Événement - AfriBiz',
  description: 'Informations et réservation pour cet événement sur AfriBiz.',
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
