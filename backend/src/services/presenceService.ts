/**
 * PresenceService — compteur « utilisateurs connectés » temps réel.
 *
 * Suit en mémoire les connexions Socket.IO (multi-onglets : un userId peut
 * avoir plusieurs socketId). Alimente le Dashboard Admin via broadcast
 * `admin:presence:update` (room admin:alerts) + endpoint REST GET /admin/presence.
 *
 * NB : état en mémoire par process — acceptable en dev/monolithe ; un restart
 * remet le compteur à zéro jusqu'à la prochaine reconnexion des sockets.
 */

const connections = new Map<string, Set<string>>(); // userId → Set<socketId>
const userRoles = new Map<string, string>(); // userId → primaryRole

function registerConnection(userId: string, socketId: string, primaryRole?: string): void {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId)!.add(socketId);
  if (primaryRole) userRoles.set(userId, primaryRole);
}

function unregisterConnection(userId: string, socketId: string): void {
  const set = connections.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) {
    connections.delete(userId);
    userRoles.delete(userId);
  }
}

export interface PresenceSnapshot {
  count: number;
  byRole: Record<string, number>;
  users: { userId: string; role: string }[];
  updatedAt: string;
}

function getPresenceSnapshot(): PresenceSnapshot {
  const byRole: Record<string, number> = {};
  const users: { userId: string; role: string }[] = [];
  for (const [userId, set] of connections) {
    if (!set || set.size === 0) continue;
    const role = userRoles.get(userId) || 'USER';
    byRole[role] = (byRole[role] || 0) + 1;
    users.push({ userId, role });
  }
  return { count: users.length, byRole, users, updatedAt: new Date().toISOString() };
}

/** Version allégée (count + byRole) pour le broadcast socket — sans la liste d'userId. */
function getPresenceSummary(): Omit<PresenceSnapshot, 'users'> {
  const { count, byRole, updatedAt } = getPresenceSnapshot();
  return { count, byRole, updatedAt };
}

function getConnectedCount(): number {
  return getPresenceSnapshot().count;
}

function getConnectedUserIds(): string[] {
  return [...connections.keys()];
}

/** Nettoie l'état (utile pour les tests). */
function reset(): void {
  connections.clear();
  userRoles.clear();
}

export const presenceService = {
  registerConnection,
  unregisterConnection,
  getPresenceSnapshot,
  getPresenceSummary,
  getConnectedCount,
  getConnectedUserIds,
  reset,
};
