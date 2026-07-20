export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description: string | null;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
}

export interface CommissionConfig {
  id: string;
  name: string;
  percentage: number;
  fixedFee: number;
  minAmount: number | null;
  maxAmount: number | null;
  active: boolean;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown> | null;
  ipAddress?: string;
  createdAt: string;
}

import type { ApiPaginationParams } from './api';

export interface AdminKyc {
  id: string;
  userId: string;
  identityDocument: string | null;
  identityType: string | null;
  identityNumber: string | null;
  missionLetter: string | null;
  facePhoto: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt: string | null;
  rejectionReason: string | null;
  submittedAt: string;
}

export interface AdminUserQuery extends ApiPaginationParams {
  search?: string;
  role?: string;
  status?: string;
}

export interface AdminBusinessQuery extends ApiPaginationParams {
  search?: string;
  status?: string;
  verified?: string;
}

export interface AdminDeveloperQuery extends ApiPaginationParams {
  search?: string;
  status?: string;
  verified?: string;
}

export interface AdminModuleQuery extends ApiPaginationParams {
  search?: string;
  status?: string;
}

export interface AdminPaymentQuery extends ApiPaginationParams {
  status?: string;
  type?: string;
}

export interface AdminAdQuery extends ApiPaginationParams {
  search?: string;
  status?: string;
}
