import Link from 'next/link';

export default function MarketplaceNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="rounded-full bg-gray-100 p-4">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Page introuvable</h2>
      <p className="text-center text-sm text-gray-500">
        Cette page du marketplace n&apos;existe pas ou a été déplacée.
      </p>
      <div className="flex gap-3">
        <Link
          href="/marketplace"
          className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Retour au marketplace
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
