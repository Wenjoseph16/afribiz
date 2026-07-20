import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { exportUserData, deleteAccount } from '../controllers/gdpr';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /gdpr/export:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Exporter ses donnees personnelles (RGPD)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archive JSON des donnees utilisateur
 */
router.get('/export', exportUserData);

/**
 * @openapi
 * /gdpr/delete:
 *   post:
 *     tags: [Utilisateurs]
 *     summary: Supprimer son compte (droit a l'effacement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmation:
 *                 type: string
 *                 example: CONFIRM_DELETE
 *     responses:
 *       200:
 *         description: Compte supprime avec succes
 */
router.post('/delete', deleteAccount);

export default router;
