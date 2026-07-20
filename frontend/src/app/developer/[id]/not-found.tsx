import Link from 'next/link';

export default function DeveloperNotFound() {
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Développeur introuvable</h2>
      <p className="text-center text-sm text-gray-500">
        Ce développeur n'existe pas ou n'a pas de profil public.
      </p>
      <Link
        href="/marketplace/modules"
        className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Voir les modules
      </Link>
    </div>
  );
}
