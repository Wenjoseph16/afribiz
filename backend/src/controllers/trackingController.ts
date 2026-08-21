import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { config } from '../config/env';

/**
 * Tracking public de campagne — accessible SANS authentification.
 *
 * Un lien inséré dans un message de campagne (WhatsApp, SMS, email...) pointe ici :
 *   GET /api/track/campaign/:id?action=open|click&redirect=/business/slug
 *
 * - action=open  → incrémente openedCount (l'utilisateur a ouvert le lien)
 * - action=click → incrémente clickedCount puis redirige vers le frontend
 *
 * Le comptage est non-bloquant : un échec ne doit JAMAIS casser le clic.
 */
export async function trackCampaignAction(req: Request, res: Response): Promise<void> {
  const campaignId = req.params.id;
  const action = req.query.action === 'click' ? 'click' : 'open';
  const redirectPath =
    typeof req.query.redirect === 'string' && req.query.redirect.startsWith('/')
      ? req.query.redirect
      : null;

  // 1) Incrément (fire-and-forget, tolérant aux erreurs)
  // Sémantique : un lien cliqué depuis WhatsApp/SMS/email compte comme OUVERTURE + CLIC.
  // Le pixel 1x1 (action=open, emails) ne compte que l'ouverture.
  try {
    if (action === 'click') {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { openedCount: { increment: 1 }, clickedCount: { increment: 1 } },
      });
    } else {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { openedCount: { increment: 1 } },
      });
    }
  } catch (err) {
    // Campagne inconnue ou erreur DB → on n'empêche pas la redirection
    logger.warn(`trackCampaignAction: increment failed (${action})`, {
      campaignId,
      error: (err as Error).message,
    });
  }

  // 2) Redirection vers le frontend (chemin relatif uniquement — pas d'open redirect)
  if (redirectPath) {
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(302, `${frontendUrl}${redirectPath}`);
    return;
  }

  // 3) Sans redirect → pixel de tracking (1x1 transparent) pour les images
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Track-Action', action);
  // GIF transparent 1x1
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}
