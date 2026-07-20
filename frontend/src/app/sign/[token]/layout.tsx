import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signature électronique - AfriBiz',
  description: 'Signez électroniquement vos documents sur AfriBiz de manière sécurisée.',
};

export default function SignTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
