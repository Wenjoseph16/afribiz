'use client';

import { useEffect, useState } from 'react';
import { Radio, Users } from 'lucide-react';
import { getSocket } from '@/services/socket';
import { useAdminPresence } from '@/features/afriScoreHooks';
import { cn } from '@/lib/utils';

interface PresenceSnapshot {
  count: number;
  byRole: Record<string, number>;
  users?: { userId: string; role: string }[];
  updatedAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  BUSINESS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CLIENT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  DEVELOPER: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

/**
 * Bandeau « utilisateurs connectés » temps réel pour le Dashboard Admin.
 * - État initial : GET /admin/presence (REST)
 * - Live : écoute l'événement socket `admin:presence:update` (broadcast room admin:alerts)
 */
export function PresenceBanner() {
  const { data } = useAdminPresence(30000);
  const [live, setLive] = useState<PresenceSnapshot | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Suit l'état connecté du socket (le socket peut se connecter APRÈS le montage
  // du bandeau — ex. SocketProvider monté plus tard ou reconnexion).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setSocketConnected(true);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Abonnement au flux temps réel uniquement quand le socket est connecté
  useEffect(() => {
    if (!socketConnected) return;
    const socket = getSocket();
    if (!socket) return;
    const handler = (snap: PresenceSnapshot) => setLive(snap);
    socket.on('admin:presence:update', handler);
    return () => {
      socket.off('admin:presence:update', handler);
    };
  }, [socketConnected]);

  const snap: PresenceSnapshot = live || data || { count: 0, byRole: {} };
  const byRole = snap.byRole || {};
  const roleEntries = Object.entries(byRole).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl border border-brand/20 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent text-xs">
      <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
        <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
        {snap.count} utilisateur{snap.count > 1 ? 's' : ''} connecté{snap.count > 1 ? 's' : ''}
      </span>
      <span className="text-gray-400 dark:text-gray-500">·</span>
      <Users className="h-3.5 w-3.5 text-gray-400" />
      {roleEntries.length === 0 ? (
        <span className="text-gray-400 dark:text-gray-500">aucun rôle actif</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {roleEntries.map(([role, count]) => (
            <span
              key={role}
              className={cn(
                'px-1.5 py-0.5 rounded-full font-medium',
                ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              {role} : {count}
            </span>
          ))}
        </div>
      )}
      {snap.updatedAt && (
        <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
          MAJ {new Date(snap.updatedAt).toLocaleTimeString('fr-FR')}
        </span>
      )}
    </div>
  );
}
