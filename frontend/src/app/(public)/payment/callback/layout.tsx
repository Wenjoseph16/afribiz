import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paiement en cours - AfriBiz',
  description: 'Traitement de votre paiement sur AfriBiz.',
};

export default function PaymentCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
