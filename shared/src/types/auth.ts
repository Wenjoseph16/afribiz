export type UserRole = 'CLIENT' | 'BUSINESS' | 'DEVELOPER' | 'ADMIN';

export type TwoFactorMethod = 'APP' | 'SMS' | 'EMAIL';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified: boolean;
  roles: UserRole[];
  primaryRole: UserRole;
  city?: string;
  address?: string;
  country?: string;
  twoFactorEnabled?: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  backupCodesUsed?: boolean;
  deviceTrustEnabled?: boolean;
  lastLoginAt?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  phone: string;
  region?: string;
  city?: string;
  neighborhood?: string;
  birthDate?: string;
  termsAccepted: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface TwoFactorSetup {
  secret?: string;
  qrCode?: string;
  method: TwoFactorMethod;
}

export interface TwoFactorVerify {
  code: string;
  method: TwoFactorMethod;
}

export interface TwoFactorChallenge {
  challengeId: string;
  method: TwoFactorMethod;
  expiresAt: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}
