import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité - AfriBiz',
  description:
    'Découvrez comment AfriBiz protège vos données personnelles et respecte votre vie privée.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
