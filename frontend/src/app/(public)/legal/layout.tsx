import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales - AfriBiz',
  description: 'Mentions légales et informations juridiques relatives à la plateforme AfriBiz.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
