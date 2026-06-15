// Response Types
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  passwordHash?: string;
}

export type UserRole = 'CLIENT' | 'BUSINESS' | 'DEVELOPER' | 'ADMIN';

export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
