import Link from 'next/link';
import { WifiOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-gray-50">
      <div className="rounded-full bg-amber-100 p-6">
        <WifiOff className="h-12 w-12 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Vous êtes hors ligne</h1>
      <p className="text-gray-500 text-center max-w-md">
        Vérifiez votre connexion internet et réessayez. Les données déjà chargées restent
        disponibles.
      </p>
      <Link href="/">
        <Button>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour à l&apos;accueil
        </Button>
      </Link>
    </div>
  );
}
