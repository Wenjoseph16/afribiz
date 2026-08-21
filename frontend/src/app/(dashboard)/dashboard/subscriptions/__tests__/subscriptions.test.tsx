import { render, screen } from '@testing-library/react';
import SubscriptionsPage from '../page';

jest.mock('@/features/hooks', () => ({
  useSubscriptionPlans: jest.fn(),
  useSubscriptionStats: jest.fn(),
}));

jest.mock('next/link', () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>
    {children}
  </a>
));

describe('SubscriptionsPage — glass premium', () => {
  const mockUseSubscriptionPlans = require('@/features/hooks').useSubscriptionPlans;
  const mockUseSubscriptionStats = require('@/features/hooks').useSubscriptionStats;

  beforeEach(() => jest.clearAllMocks());

  it('shows loading spinner', () => {
    mockUseSubscriptionPlans.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    mockUseSubscriptionStats.mockReturnValue({ data: null });
    render(<SubscriptionsPage />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders plans', () => {
    mockUseSubscriptionPlans.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Pro',
          price: 15000,
          duration: 'MONTHLY',
          status: 'ACTIVE',
          subscriberCount: 20,
          features: ['Feature 1'],
          description: 'Plan pro',
        },
        {
          id: '2',
          name: 'Basic',
          price: 5000,
          duration: 'ANNUAL',
          status: 'ACTIVE',
          subscriberCount: 5,
          features: [],
          description: '',
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseSubscriptionStats.mockReturnValue({
      data: { totalPlans: 2, activeSubscribers: 25, monthlyRevenue: 325000, churnRate: 0 },
    });
    render(<SubscriptionsPage />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    mockUseSubscriptionPlans.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseSubscriptionStats.mockReturnValue({ data: null });
    render(<SubscriptionsPage />);
    expect(screen.getByText(/Aucun plan/)).toBeInTheDocument();
  });
});
