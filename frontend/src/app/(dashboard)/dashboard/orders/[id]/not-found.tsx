import Link from 'next/link';

export default function OrderNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="rounded-full bg-amber-100 p-4">
        <svg
          className="h-8 w-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Commande introuvable</h2>
      <p className="text-center text-sm text-gray-500">
        Cette commande n&apos;existe pas ou a été supprimée.
      </p>
      <Link
        href="/dashboard/orders"
        className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Voir mes commandes
      </Link>
    </div>
  );
}
