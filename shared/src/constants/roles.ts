import type { UserRole } from '../types/auth';

export const ROLES: Record<UserRole, string> = {
  CLIENT: 'Client',
  BUSINESS: 'Commerçant',
  DEVELOPER: 'Développeur',
  ADMIN: 'Administrateur',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  CLIENT: 0,
  BUSINESS: 1,
  DEVELOPER: 2,
  ADMIN: 3,
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  CLIENT: 'Accès aux fonctionnalités de base : navigation, commandes, réservations',
  BUSINESS: 'Gestion de son commerce : produits, services, commandes, statistiques',
  DEVELOPER: 'Accès API, documentation technique, sandbox de test',
  ADMIN: 'Administration de la plateforme : utilisateurs, paramètres, modération',
};

export const ADMIN_ROLES: UserRole[] = ['ADMIN'];
export const STAFF_ROLES: UserRole[] = ['ADMIN', 'DEVELOPER'];
export const MERCHANT_ROLES: UserRole[] = ['BUSINESS', 'DEVELOPER', 'ADMIN'];
export const ALL_ROLES: UserRole[] = ['CLIENT', 'BUSINESS', 'DEVELOPER', 'ADMIN'];

export function canAccess(required: UserRole, userRoles: UserRole[]): boolean {
  const requiredLevel = ROLE_HIERARCHY[required];
  return userRoles.some((r) => ROLE_HIERARCHY[r] >= requiredLevel);
}
