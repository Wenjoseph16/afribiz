import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyAdCampaigns, useCreateAdCampaign } from '../adsHooks';
import { apiClient } from '@/services/apiClient';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    getMyAdCampaigns: jest.fn(),
    createAdCampaign: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('adsHooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useMyAdCampaigns', () => {
    it('devrait retourner les campagnes', async () => {
      const mockCampaigns = [{ id: '1', name: 'Campagne Test', status: 'ACTIVE' }];
      (apiClient.getMyAdCampaigns as jest.Mock).mockResolvedValue({ data: { data: mockCampaigns } });

      const { result } = renderHook(() => useMyAdCampaigns(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockCampaigns);
    });

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      (apiClient.getMyAdCampaigns as jest.Mock).mockRejectedValue(new Error('Erreur API'));

      const { result } = renderHook(() => useMyAdCampaigns(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useCreateAdCampaign', () => {
    it('devrait creer une campagne avec succes', async () => {
      const newCampaign = { name: 'Nouvelle campagne', budget: 10000 };
      (apiClient.createAdCampaign as jest.Mock).mockResolvedValue({ data: { data: newCampaign } });

      const { result } = renderHook(() => useCreateAdCampaign(), { wrapper });

      result.current.mutate(newCampaign);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiClient.createAdCampaign).toHaveBeenCalledWith(newCampaign);
    });
  });
});
