import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos - AfriBiz',
  description:
    "Découvrez AfriBiz, la plateforme qui connecte les entrepreneurs, développeurs et communautés pour booster l'économie africaine.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
