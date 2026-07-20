import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aperçu - AfriBiz',
  description: 'Aperçu des fonctionnalités de la plateforme AfriBiz.',
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
