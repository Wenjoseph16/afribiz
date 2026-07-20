import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateEventData, UpdateEventData } from '@/types';

export const eventKeys = {
  all: ['my-events'] as const,
  detail: (id: string) => ['my-events', id] as const,
  tickets: (eventId: string) => ['my-events', eventId, 'tickets'] as const,
  participants: (eventId: string) => ['my-events', eventId, 'participants'] as const,
  stats: (id: string) => ['my-events', id, 'stats'] as const,
  dashboardStats: ['my-events', 'dashboard', 'stats'] as const,
};

export function useMyEvents(params?: QueryParams) {
  return useQuery({
    queryKey: [...eventKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyEvents(params);
      return res.data.data;
    },
  });
}

export function useMyEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyEvent(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventData) => apiClient.createEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventData }) =>
      apiClient.updateEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useEventDashboardStats() {
  return useQuery({
    queryKey: eventKeys.dashboardStats,
    queryFn: async () => {
      const res = await apiClient.getEventDashboardStats();
      return res.data.data;
    },
  });
}

export function useEventTickets(eventId: string) {
  return useQuery({
    queryKey: eventKeys.tickets(eventId),
    queryFn: async () => {
      const res = await apiClient.getEventTickets(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useCreateEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      apiClient.createEventTicket(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.tickets(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ticketId,
      data,
    }: {
      eventId: string;
      ticketId: string;
      data: Record<string, unknown>;
    }) => apiClient.updateEventTicket(eventId, ticketId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.tickets(variables.eventId) });
    },
  });
}

export function useDeleteEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ticketId }: { eventId: string; ticketId: string }) =>
      apiClient.deleteEventTicket(eventId, ticketId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.tickets(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useEventParticipants(eventId: string) {
  return useQuery({
    queryKey: eventKeys.participants(eventId),
    queryFn: async () => {
      const res = await apiClient.getEventParticipants(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useRegisterEventParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      apiClient.registerEventParticipant(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.participants(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.stats(variables.eventId) });
    },
  });
}

export function useUpdateParticipantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      participantId,
      status,
    }: {
      eventId: string;
      participantId: string;
      status: string;
    }) => apiClient.updateEventParticipantStatus(eventId, participantId, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.participants(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.stats(variables.eventId) });
    },
  });
}

export function useMyTicket(eventId: string) {
  return useQuery({
    queryKey: ['my-ticket', eventId],
    queryFn: async () => {
      const res = await apiClient.getMyTicket(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useEventScans(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'scans'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventScans(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useScanTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ticketRef }: { eventId: string; ticketRef: string }) =>
      apiClient.scanEventTicket(eventId, ticketRef),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'scans'] });
      qc.invalidateQueries({ queryKey: eventKeys.participants(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.stats(variables.eventId) });
    },
  });
}

export function useEventPromotions(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'promotions'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventPromotions(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useCreateEventPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      apiClient.createEventPromotion(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'promotions'] });
    },
  });
}

export function useDeleteEventPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, promoId }: { eventId: string; promoId: string }) =>
      apiClient.deleteEventPromotion(eventId, promoId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'promotions'] });
    },
  });
}

export function useEventGallery(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'gallery'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventGallery(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useAddEventGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      apiClient.addEventGalleryItem(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'gallery'] });
    },
  });
}

export function useDeleteEventGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, itemId }: { eventId: string; itemId: string }) =>
      apiClient.deleteEventGalleryItem(eventId, itemId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'gallery'] });
    },
  });
}

export function useEventPartners(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'partners'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventPartners(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useAddEventPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Record<string, unknown> }) =>
      apiClient.addEventPartner(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'partners'] });
    },
  });
}

export function useRemoveEventPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, partnerId }: { eventId: string; partnerId: string }) =>
      apiClient.removeEventPartner(eventId, partnerId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'partners'] });
    },
  });
}

export function useEventStats(id: string) {
  return useQuery({
    queryKey: eventKeys.stats(id),
    queryFn: async () => {
      const res = await apiClient.getEventStats(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useRegisterForEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.registerForEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
