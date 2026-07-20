import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions générales - AfriBiz',
  description: "Consultez les conditions générales d'utilisation de la plateforme AfriBiz.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
