import { render, screen, waitFor } from '@testing-library/react';
import PricingPage from '@/app/(public)/pricing/page';

// Mock framer-motion pour jsdom
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react : les icônes sont des composants simples
jest.mock('lucide-react', () => {
  const Icon = ({ children, ...props }: any) => (
    <svg data-testid="icon" {...props}>
      {children}
    </svg>
  );
  return new Proxy(
    { default: Icon },
    {
      get: (_target, prop) => {
        if (prop === 'default') return Icon;
        return Icon;
      },
    }
  );
});

// Mock next/link
jest.mock('next/link', () => {
  const Link = ({ children, ...props }: any) => <a {...props}>{children}</a>;
  return Link;
});

// Mock Header/Footer (dépendances lourdes : authStore, socket, etc.)
jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header" />,
}));
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

describe('Page /pricing (dynamique depuis /api/plans)', () => {
  beforeEach(() => {
    global.fetch = jest.fn(
      () =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                plans: [
                  {
                    id: 'platform-free',
                    name: 'Gratuit',
                    price: 0,
                    description: 'Pour démarrer sans risque',
                    benefits: ['Profil business public complet', 'Tous les modules de gestion'],
                    privileges: [{ code: 'COMMISSION_TRANSACTION', value: 1 }],
                    badge: '🔥 Populaire',
                  },
                  {
                    id: 'platform-afribiz',
                    name: 'AfriBiz',
                    price: 5000,
                    description: "L'abonnement unique, tout inclus",
                    benefits: ['100% des modules, sans limite', 'Support prioritaire'],
                    privileges: [{ code: 'COMMISSION_TRANSACTION', value: 0.5 }],
                    badge: '🚀 Recommandé',
                  },
                  {
                    id: 'platform-copilot',
                    name: 'Copilot IA',
                    price: 3000,
                    description: 'Votre assistant virtuel intelligent',
                    benefits: ['Alertes WhatsApp automatiques'],
                    privileges: [{ code: 'COPILOT_ACCESS', value: 1 }],
                    badge: '✨ Option IA',
                  },
                ],
                commissions: { transaction: 0.01, escrow: 0.02 },
              },
            }),
        }) as any
    ) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retombe sur les plans statiques quand l\u2019API est injoignable (fallback)', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network down')) as any) as any;

    render(<PricingPage />);

    // Les plans statiques sont rendus par défaut (fallback)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Gratuit' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'AfriBiz' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Copilot IA' })).toBeInTheDocument();
  });

  it('affiche les 3 plans stratégiques (Gratuit, AfriBiz, Copilot IA) avec leurs tarifs', async () => {
    render(<PricingPage />);

    // Les 3 cartes de plans (h3 des cartes)
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'Gratuit' }).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('heading', { name: 'AfriBiz' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Copilot IA' })).toBeInTheDocument();

    // Tarifs chargés depuis l'API (formatés)
    expect(screen.getByText('5 000')).toBeInTheDocument();
    expect(screen.getByText('3 000')).toBeInTheDocument();
  });

  it('affiche les badges et le bandeau Développeur', async () => {
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('🔥 Populaire')).toBeInTheDocument();
    });

    // Badges des plans
    expect(screen.getByText('🔥 Populaire')).toBeInTheDocument();
    expect(screen.getByText('🚀 Recommandé')).toBeInTheDocument();
    expect(screen.getByText('✨ Option IA')).toBeInTheDocument();

    // Bandeau Développeur (features du bandeau : API REST, sandbox)
    expect(screen.getByRole('heading', { name: 'Développeur' })).toBeInTheDocument();
    expect(screen.getByText('Accès API REST complet')).toBeInTheDocument();
    expect(screen.getByText('Sandbox de test')).toBeInTheDocument();
  });

  it('affiche la commission dynamique (1% transactions, 2% escrow)', async () => {
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('🔥 Populaire')).toBeInTheDocument();
    });

    // Section "Comment gagnons-nous de l'argent ?"
    expect(screen.getByText('1% sur les transactions')).toBeInTheDocument();
    expect(screen.getByText("2% sur l'Escrow")).toBeInTheDocument();
  });
});
