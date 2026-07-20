import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - AfriBiz',
  description:
    'Connectez-vous à votre compte AfriBiz pour accéder à vos services, commandes et bien plus encore.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
