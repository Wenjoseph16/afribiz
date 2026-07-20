import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - AfriBiz',
  description:
    'Créez votre compte AfriBiz gratuitement et rejoignez la première plateforme de business en Afrique.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
