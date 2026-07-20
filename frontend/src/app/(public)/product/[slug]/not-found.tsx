import Link from 'next/link';
import { Package, ChevronLeft } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <Package className="h-16 w-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Produit introuvable</h2>
      <p className="text-gray-500 mb-6">Ce produit n'existe pas ou a été retiré.</p>
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-brand font-medium hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Retour au marketplace
      </Link>
    </div>
  );
}
