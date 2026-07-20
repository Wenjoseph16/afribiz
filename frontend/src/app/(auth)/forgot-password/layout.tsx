import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mot de passe oublié - AfriBiz',
  description:
    'Réinitialisez votre mot de passe AfriBiz. Recevez un lien de réinitialisation par email.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
