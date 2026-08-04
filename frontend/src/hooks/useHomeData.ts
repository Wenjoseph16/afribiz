import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface HomeTestimonial {
  id: string;
  name: string;
  title?: string | null;
  company?: string | null;
  avatar?: string | null;
  content: string;
  rating: number;
  isFeatured: boolean;
}

export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface HomeModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  isFree: boolean;
  category: string;
  isFeatured: boolean;
  isVerified: boolean;
  tags: string[];
}

export interface HomeBusiness {
  id: string;
  name: string;
  slug: string;
  type?: string | null;
  city?: string | null;
  country?: string | null;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
}

export interface HomeData {
  testimonials: HomeTestimonial[];
  faqs: HomeFaq[];
  modules: HomeModule[];
  topBusinesses: HomeBusiness[];
  stats: Array<{ id: string; label: string; value: string; prefix?: string; suffix?: string }>;
}

// Hook partagé : un SEUL appel GET /api/home pour toute la page d accueil
// (react-query déduplique les appels entre toutes les sections montées)
export function useHomeData() {
  return useQuery<HomeData>({
    queryKey: ['home', 'data'],
    queryFn: async () => {
      const res = await apiClient.getHomeData();
      const d = res?.data?.data;
      return {
        testimonials: d?.testimonials || [],
        faqs: d?.faqs || [],
        modules: d?.modules || [],
        topBusinesses: d?.topBusinesses || [],
        stats: d?.stats || [],
      };
    },
    staleTime: 60_000, // 60s sans refetch automatique
    retry: 1,
  });
}
