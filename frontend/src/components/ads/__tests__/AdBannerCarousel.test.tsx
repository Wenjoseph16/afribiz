import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdBannerCarousel } from '../AdBannerCarousel';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AdBannerCarousel', () => {
  it('devrait rendre le composant sans pubs (loading)', () => {
    const { container } = render(<AdBannerCarousel />, { wrapper });
    // Pas de pubs => rend null
    expect(container.innerHTML).toBe('');
  });

  it('devrait accepter le props country', () => {
    const { container } = render(<AdBannerCarousel country="Togo" />, { wrapper });
    expect(container.innerHTML).toBe('');
  });

  it('devrait accepter le props autoplaySpeed', () => {
    const { container } = render(<AdBannerCarousel autoplaySpeed={3000} />, { wrapper });
    expect(container.innerHTML).toBe('');
  });
});
