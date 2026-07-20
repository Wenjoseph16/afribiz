import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réinitialisation du mot de passe - AfriBiz',
  description: 'Définissez un nouveau mot de passe pour votre compte AfriBiz.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
