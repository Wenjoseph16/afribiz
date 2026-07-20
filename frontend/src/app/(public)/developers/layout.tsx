import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Développeurs - AfriBiz',
  description:
    'Rejoignez le programme développeurs AfriBiz. Créez, publiez et monétisez vos modules sur notre marketplace.',
};

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
