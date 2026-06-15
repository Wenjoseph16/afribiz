import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders, useCreateBusinessOrder, useCart } from '../hooks';
import { apiClient } from '@/services/apiClient';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    getOrders: jest.fn(),
    createBusinessOrder: jest.fn(),
    getCart: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait retourner la liste des commandes', async () => {
    const mockOrders = [{ id: '1', status: 'PENDING', totalAmount: 5000 }];
    (apiClient.getOrders as jest.Mock).mockResolvedValue({ data: { data: mockOrders } });

    const { result } = renderHook(() => useOrders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockOrders);
    expect(apiClient.getOrders).toHaveBeenCalledTimes(1);
  });

  it('devrait gerer l erreur API', async () => {
    (apiClient.getOrders as jest.Mock).mockRejectedValue(new Error('Erreur reseau'));

    const { result } = renderHook(() => useOrders(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('devrait passer les parametres de filtrage', async () => {
    const params = { status: 'PENDING', page: 1, limit: 10 };
    (apiClient.getOrders as jest.Mock).mockResolvedValue({ data: { data: [] } });

    renderHook(() => useOrders(params), { wrapper });

    await waitFor(() => {
      expect(apiClient.getOrders).toHaveBeenCalledWith(params);
    });
  });
});

describe('useCreateBusinessOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait creer une commande avec succes', async () => {
    const newOrder = { businessId: 'biz-1', items: [{ productId: 'p-1', quantity: 2 }] };
    (apiClient.createBusinessOrder as jest.Mock).mockResolvedValue({ data: { data: { id: 'order-1', ...newOrder } } });

    const { result } = renderHook(() => useCreateBusinessOrder(), { wrapper });

    result.current.mutate(newOrder);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.createBusinessOrder).toHaveBeenCalledWith(newOrder);
  });

  it('devrait retourner une erreur si la creation echoue', async () => {
    (apiClient.createBusinessOrder as jest.Mock).mockRejectedValue(new Error('Erreur creation'));

    const { result } = renderHook(() => useCreateBusinessOrder(), { wrapper });

    result.current.mutate({ businessId: 'biz-1', items: [] });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait retourner le panier vide', async () => {
    const mockCart = { items: [], total: 0 };
    (apiClient.getCart as jest.Mock).mockResolvedValue({ data: { data: mockCart } });

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCart);
  });

  it('devrait retourner le panier avec des articles', async () => {
    const mockCart = {
      items: [{ id: 'item-1', name: 'Produit Test', quantity: 2, unitPrice: 5000 }],
      total: 10000,
    };
    (apiClient.getCart as jest.Mock).mockResolvedValue({ data: { data: mockCart } });

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.items).toHaveLength(1);
    expect(result.current.data.total).toBe(10000);
  });
});
