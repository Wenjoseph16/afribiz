import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil développeur - AfriBiz',
  description: "Profil et modules d'un développeur sur AfriBiz Marketplace.",
};

export default function DeveloperIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
