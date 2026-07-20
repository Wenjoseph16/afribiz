import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams } from '@/types';

export const bookingKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => ['bookings', id] as const,
};

export function useBookings(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...bookingKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getBookings(params);
      return res.data.data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getBooking(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export const bizBookingKeys = {
  all: ['biz-bookings'] as const,
  detail: (id: string) => ['biz-bookings', id] as const,
  calendar: ['biz-bookings', 'calendar'] as const,
  resources: ['biz-bookings', 'resources'] as const,
  slots: ['biz-bookings', 'slots'] as const,
};

export function useMyBusinessBookings(params?: QueryParams) {
  return useQuery({
    queryKey: [...bizBookingKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyBusinessBookings(params);
      return res.data.data;
    },
  });
}

export function useMyBusinessBooking(id: string) {
  return useQuery({
    queryKey: bizBookingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyBusinessBooking(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useBookingResources() {
  return useQuery({
    queryKey: bizBookingKeys.resources,
    queryFn: async () => {
      const res = await apiClient.getBookingResources();
      return res.data.data;
    },
  });
}

export function useCreateBookingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBookingResource(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.resources }),
  });
}

export function useUpdateBookingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateBookingResource(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.resources }),
  });
}

export function useDeleteBookingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBookingResource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.resources }),
  });
}

export function useBookingSlots() {
  return useQuery({
    queryKey: bizBookingKeys.slots,
    queryFn: async () => {
      const res = await apiClient.getBookingSlots();
      return res.data.data;
    },
  });
}

export function useCreateBookingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBookingSlot(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.slots }),
  });
}

export function useUpdateBookingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateBookingSlot(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.slots }),
  });
}

export function useDeleteBookingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBookingSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.slots }),
  });
}

export function useBookingsCalendar(params?: QueryParams) {
  return useQuery({
    queryKey: [...bizBookingKeys.calendar, params],
    queryFn: async () => {
      const res = await apiClient.getBookingCalendar(params);
      return res.data.data;
    },
  });
}

export function useBookingCalendar(params?: QueryParams) {
  return useQuery({
    queryKey: [...bizBookingKeys.calendar, params],
    queryFn: async () => {
      const res = await apiClient.getBookingCalendar(params);
      return res.data.data;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBusinessBooking(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useRoomPlanning(params?: QueryParams) {
  return useQuery({
    queryKey: ['room-planning', params],
    queryFn: async () => {
      const [roomsRes, bookingsRes] = await Promise.all([
        apiClient.getMyRooms({ status: 'ACTIVE' }),
        apiClient.getMyBusinessBookings({ status: 'CONFIRMED,ARRIVED,OCCUPIED' }),
      ]);
      return {
        rooms: roomsRes.data.data?.items || roomsRes.data.data || [],
        bookings: bookingsRes.data.data?.items || bookingsRes.data.data || [],
        blocks: [],
      };
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.cancelMyBooking(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
    },
  });
}

export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startDate, endDate }: { id: string; startDate: string; endDate?: string }) =>
      apiClient.rescheduleMyBooking(id, startDate, endDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useUpdateBusinessBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateBusinessBooking(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useDeleteBusinessBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBusinessBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useSendBookingReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, channel }: { id: string; type: string; channel: string }) =>
      apiClient.sendBookingReminder(id, type, channel),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.detail(variables.id) });
    },
  });
}
