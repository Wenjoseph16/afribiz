// Ce fichier s'exécute AVANT l'installation du framework de test (setupFiles)
// Ne pas importer jest-dom ici - il est dans setup-framework.ts (setupFilesAfterEnv)

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
