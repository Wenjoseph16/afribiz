import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

/**
 * Mode maintenance — middleware global.
 * Quand `maintenanceMode` est actif dans la table PlatformSetting, toutes les
 * requêtes API renvoient 503, SAUF :
 *  - /api/admin/*  → l'admin doit pouvoir désactiver le mode
 *  - /api/auth/*   → un admin doit pouvoir se connecter
 *  - /api/health, /api/metrics → sondes
 * Le statut est mis en cache 15s pour ne pas marteler la base à chaque requête.
 */

let cache: { value: boolean; at: number } | null = null;
const CACHE_TTL = 15_000;

async function isMaintenanceMode(): Promise<boolean> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.value;
  try {
    const row = await (prisma as any).platformSetting.findUnique({
      where: { key: 'maintenanceMode' },
    });
    const value = row?.value === true || row?.value === 'true';
    cache = { value, at: Date.now() };
    return value;
  } catch {
    cache = { value: false, at: Date.now() };
    return false;
  }
}

export function maintenanceMode(req: Request, res: Response, next: NextFunction) {
  // Routes toujours accessibles pendant la maintenance
  if (
    req.path.startsWith('/admin') ||
    req.path.startsWith('/auth') ||
    req.path === '/health' ||
    req.path === '/metrics' ||
    req.path === '/public/maintenance-status'
  ) {
    return next();
  }

  void isMaintenanceMode().then((maintenance) => {
    if (maintenance) {
      return res.status(503).json({
        success: false,
        error: 'MAINTENANCE_MODE',
        message: 'La plateforme est en maintenance. Réessayez dans quelques instants.',
      });
    }
    return next();
  });
}

// Permet d'invalider le cache (appelé quand l'admin change le réglage)
export function resetMaintenanceCache() {
  cache = null;
}
