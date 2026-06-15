import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartIcon } from '../CartIcon';

jest.mock('@/features/hooks', () => ({
  useCart: jest.fn().mockReturnValue({ data: { items: [] }, isLoading: false }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CartIcon', () => {
  it('devrait rendre le composant avec le lien vers le panier', () => {
    render(<CartIcon />, { wrapper });
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard/cart');
  });
});
