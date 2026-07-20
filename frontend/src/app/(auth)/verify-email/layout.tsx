import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vérification email - AfriBiz',
  description: 'Vérifiez votre adresse email pour activer votre compte AfriBiz.',
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
