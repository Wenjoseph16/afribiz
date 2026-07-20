import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paiement - AfriBiz',
  description:
    'Finalisez votre commande sur AfriBiz en toute sécurité. Paiement sécurisé, livraison rapide.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
