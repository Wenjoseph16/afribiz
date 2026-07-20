import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - AfriBiz',
  description:
    "Contactez l'équipe AfriBiz. Besoin d'aide, de partenariat ou d'informations ? Notre équipe vous répond sous 24h.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
