'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

// ===================== PARTNERS =====================

export function usePartners(params?: any) {
  return useQuery({
    queryKey: ['partners', params],
    queryFn: () => apiClient.getPartners(params),
    select: (res) => res.data?.data,
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ['partner', id],
    queryFn: () => apiClient.getPartner(id),
    enabled: !!id,
    select: (res) => res.data?.data,
  });
}

export function usePartnerStats() {
  return useQuery({
    queryKey: ['partner-stats'],
    queryFn: () => apiClient.getPartnerStats(),
    select: (res) => res.data?.data,
  });
}

export function usePartnerAnalytics() {
  return useQuery({
    queryKey: ['partner-analytics'],
    queryFn: () => apiClient.getPartnerAnalytics(),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartner(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); qc.invalidateQueries({ queryKey: ['partner-stats'] }); },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePartner(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); qc.invalidateQueries({ queryKey: ['partner-stats'] }); },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePartner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); qc.invalidateQueries({ queryKey: ['partner-stats'] }); },
  });
}

// ===================== CONTRACTS =====================

export function usePartnerContracts(params?: any) {
  return useQuery({
    queryKey: ['partner-contracts', params],
    queryFn: () => apiClient.getPartnerContracts(params),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartnerContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartnerContract(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-contracts'] }),
  });
}

export function useSignPartnerContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, byBusiness }: { id: string; byBusiness: boolean }) => apiClient.signPartnerContract(id, byBusiness),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-contracts'] }),
  });
}

// ===================== TRANSACTIONS =====================

export function usePartnerTransactions(params?: any) {
  return useQuery({
    queryKey: ['partner-transactions', params],
    queryFn: () => apiClient.getPartnerTransactions(params),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartnerTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartnerTransaction(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-transactions'] }),
  });
}

// ===================== ASSIGNMENTS =====================

export function usePartnerAssignments(params?: any) {
  return useQuery({
    queryKey: ['partner-assignments', params],
    queryFn: () => apiClient.getPartnerAssignments(params),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartnerAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartnerAssignment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-assignments'] }),
  });
}

// ===================== REVIEWS =====================

export function usePartnerReviews(params?: any) {
  return useQuery({
    queryKey: ['partner-reviews', params],
    queryFn: () => apiClient.getPartnerReviews(params),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartnerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartnerReview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-reviews'] }),
  });
}

// ===================== DOCUMENTS =====================

export function usePartnerDocuments(params?: any) {
  return useQuery({
    queryKey: ['partner-documents', params],
    queryFn: () => apiClient.getPartnerDocuments(params),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartnerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartnerDocument(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-documents'] }),
  });
}

export function useDeletePartnerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePartnerDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-documents'] }),
  });
}

// ===================== PERMISSIONS =====================

export function usePartnerPermissions(params?: any) {
  return useQuery({
    queryKey: ['partner-permissions', params],
    queryFn: () => apiClient.getPartnerPermissions(params),
    select: (res) => res.data?.data,
  });
}

export function useCreatePartnerPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPartnerPermission(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-permissions'] }),
  });
}

export function useDeletePartnerPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePartnerPermission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-permissions'] }),
  });
}

// ===================== PUBLIC PARTNERS =====================

export function usePublicPartners(slug: string) {
  return useQuery({
    queryKey: ['public-partners', slug],
    queryFn: () => apiClient.getPublicPartners(slug),
    enabled: !!slug,
    select: (res) => res.data?.data,
  });
}
