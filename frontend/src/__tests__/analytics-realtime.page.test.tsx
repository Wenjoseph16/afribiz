import { render, screen, fireEvent } from '@testing-library/react';
import AnalyticsRealtimePage from '@/app/(dashboard)/dashboard/analytics/realtime/page';

// Recharts ne fonctionne pas en jsdom (ResponsiveContainer) → mock simple
jest.mock('recharts', () => {
  const Passthrough = ({ children }: any) => <div>{children}</div>;
  return {
    ResponsiveContainer: Passthrough,
    PieChart: Passthrough,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => null,
    Tooltip: () => null,
  };
});

const feedEvents = [
  {
    id: 'ev-1',
    type: 'order',
    category: 'commercial',
    eventName: 'ORDER_PLACED',
    value: 15000,
    properties: { orderId: 'ord-12345678' },
    occurredAt: '2026-08-03T10:30:00.000Z',
  },
  {
    id: 'ev-2',
    type: 'page_view',
    category: 'navigation',
    eventName: 'BUSINESS_VIEWED',
    value: null,
    properties: {},
    occurredAt: '2026-08-03T09:15:00.000Z',
  },
];

jest.mock('@/features/afriScoreHooks', () => ({
  useAnalyticsEvents: jest.fn(() => ({
    data: { events: feedEvents, total: 2, page: 1, limit: 20, totalPages: 1 },
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
    dataUpdatedAt: 1000,
  })),
  useAnalyticsEventsSummary: jest.fn(() => ({
    data: { total: 42, today: 5, byType: [], byCategory: [] },
    isLoading: false,
    dataUpdatedAt: 1000,
  })),
  useAnalyticsBreakdownByType: jest.fn(() => ({
    data: [
      { type: 'order', count: 3 },
      { type: 'booking', count: 1 },
    ],
  })),
  useAnalyticsBreakdownByCategory: jest.fn(() => ({
    data: [{ category: 'commercial', count: 4 }],
  })),
  useAnalyticsEventsCounters: jest.fn(() => ({
    data: { period: 30, totals: { order: 3 }, revenue: 5000, eventCount: 3 },
  })),
}));

describe('AnalyticsRealtimePage', () => {
  it('renders the page header and summary KPIs', () => {
    render(<AnalyticsRealtimePage />);
    expect(screen.getByText('Flux temps réel')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // total events
    expect(screen.getByText('5')).toBeInTheDocument(); // today
    expect(screen.getByText('5 000 FCFA')).toBeInTheDocument(); // revenue
  });

  it('renders the two breakdown donuts', () => {
    render(<AnalyticsRealtimePage />);
    expect(screen.getByText('Répartition par type')).toBeInTheDocument();
    expect(screen.getByText('Répartition par catégorie')).toBeInTheDocument();
    // Légende des segments (order apparaît aussi comme option du select type)
    expect(screen.getAllByText('order').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('commercial').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the event feed with tracked actions', () => {
    render(<AnalyticsRealtimePage />);
    expect(screen.getByText('ORDER_PLACED')).toBeInTheDocument();
    expect(screen.getByText('BUSINESS_VIEWED')).toBeInTheDocument();
    expect(screen.getByText('Commande #ord-1234')).toBeInTheDocument();
  });

  it('provides filters (search, type, category)', () => {
    render(<AnalyticsRealtimePage />);
    expect(
      screen.getByPlaceholderText(/Rechercher un événement/)
    ).toBeInTheDocument();
    expect(screen.getByText('Tous les types')).toBeInTheDocument();
    expect(screen.getByText('Toutes les catégories')).toBeInTheDocument();
  });

  it('lets the user toggle auto-refresh', () => {
    render(<AnalyticsRealtimePage />);
    const autoBtn = screen.getByText(/Auto/);
    expect(autoBtn).toHaveTextContent('Auto ON');
    fireEvent.click(autoBtn);
    expect(screen.getByText(/Auto OFF/)).toBeInTheDocument();
  });
});
