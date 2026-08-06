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
                    id: 'platform-afribiz',
                    name: 'AfriBiz',
                    price: 0,
                    description: "L'abonnement unique, tout inclus — GRATUIT pour le lancement",
                    benefits: ['100% des modules, sans limite', 'Copilot IA inclus gratuitement'],
                    privileges: [{ code: 'COMMISSION_TRANSACTION', value: 1 }],
                    badge: '🔥 Promo lancement : gratuit',
                  },
                  // Le plan Copilot IA est isPublic=false → absent de l'API (préparé, pas vendu)
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

    // Les plans statiques sont rendus par défaut (fallback) : AfriBiz + Copilot « Bientôt »
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'AfriBiz' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Copilot IA' })).toBeInTheDocument();
  });

  it('affiche AfriBiz (0 FCFA promo) + la carte Copilot « Bientôt » persistée', async () => {
    render(<PricingPage />);

    // AfriBiz vient de l'API (prix 0 → « 0 ») ; Copilot est une carte statique conservée
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'AfriBiz' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Copilot IA' })).toBeInTheDocument();

    // Tarifs : AfriBiz gratuit (0), Copilot « Bientôt »
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Bientôt')).toBeInTheDocument();
  });

  it('affiche les badges promo et le bandeau Développeur', async () => {
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Promo lancement/i)).toBeInTheDocument();
    });

    // Badge de la carte AfriBiz (promo) + carte Copilot (bientôt)
    expect(screen.getByText('✨ Bientôt disponible')).toBeInTheDocument();

    // Bandeau Développeur (features du bandeau : API REST, sandbox)
    expect(screen.getByRole('heading', { name: 'Développeur' })).toBeInTheDocument();
    expect(screen.getByText('Accès API REST complet')).toBeInTheDocument();
    expect(screen.getByText('Sandbox de test')).toBeInTheDocument();
  });

  it('affiche la commission dynamique (1% transactions, 2% escrow)', async () => {
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Promo lancement/i)).toBeInTheDocument();
    });

    // Section "Comment gagnons-nous de l'argent ?"
    expect(screen.getByText('1% sur les transactions')).toBeInTheDocument();
    expect(screen.getByText("2% sur l'Escrow")).toBeInTheDocument();
  });
});
