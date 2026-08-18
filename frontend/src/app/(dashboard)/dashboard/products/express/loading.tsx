import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <Loader2 className="h-8 w-8 text-brand animate-spin mb-4" />
      <p className="text-sm text-gray-500">Chargement de l&apos;inventaire express…</p>
    </div>
  );
}
