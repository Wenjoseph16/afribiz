'use client';

/**
 * Mode voir-comme (impersonation lecture seule) côté frontend.
 *
 * Principe : le backend fournit un JWT court (15 min) marqué `impersonating`.
 * On le met dans `accessToken` (l'apiClient l'utilise naturellement) et on
 * sauvegarde le token admin d'origine pour pouvoir revenir.
 */

const IMP_KEY = 'impersonationAdminToken';
const IMP_TARGET_KEY = 'impersonationTarget';

export interface ImpersonationTarget {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: string;
}

export function isImpersonating(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(IMP_KEY);
}

export function getImpersonationTarget(): ImpersonationTarget | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(IMP_TARGET_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationTarget;
  } catch {
    return null;
  }
}

/** Démarre le mode voir-comme : sauvegarde le token admin, active le token imp. */
export function startImpersonation(token: string, target: ImpersonationTarget): void {
  if (typeof window === 'undefined') return;
  const adminToken = localStorage.getItem('accessToken');
  if (adminToken) localStorage.setItem(IMP_KEY, adminToken);
  localStorage.setItem(IMP_TARGET_KEY, JSON.stringify(target));
  localStorage.setItem('accessToken', token);
  document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Lax`;
}

/** Quitte le mode voir-comme : restaure le token admin. */
export function stopImpersonation(): void {
  if (typeof window === 'undefined') return;
  const adminToken = localStorage.getItem(IMP_KEY);
  if (adminToken) {
    localStorage.setItem('accessToken', adminToken);
    document.cookie = `accessToken=${adminToken}; path=/; max-age=900; SameSite=Lax`;
  }
  localStorage.removeItem(IMP_KEY);
  localStorage.removeItem(IMP_TARGET_KEY);
}
