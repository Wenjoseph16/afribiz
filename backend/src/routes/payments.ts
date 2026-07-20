import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { z } from 'zod';
import { getPayments, getPayment, getWallet, addPaymentProof } from '../controllers/payments';
import {
  listClientEscrows,
  clientReleaseEscrow,
  clientDisputeEscrow,
  listClientDebts,
  clientPayDebt,
} from '../controllers/debtsPayments';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Paiements]
 *     summary: Lister les paiements de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des paiements
 */
router.get('/', requireRole(['CLIENT', 'BUSINESS', 'ADMIN']), getPayments);

/**
 * @openapi
 * /payments/wallet:
 *   get:
 *     tags: [Portefeuille]
 *     summary: Obtenir le solde du portefeuille et le cashback
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Solde et cashback
 */
router.get('/wallet', requireRole(['CLIENT', 'BUSINESS', 'ADMIN']), getWallet);

/**
 * @openapi
 * /payments/escrow/client:
 *   get:
 *     tags: [Escrow]
 *     summary: Lister les sequestres client
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sequestres
 */
router.get('/escrow/client', requireRole(['CLIENT', 'ADMIN']), listClientEscrows);

/**
 * @openapi
 * /payments/escrow/client/{id}/confirm:
 *   post:
 *     tags: [Escrow]
 *     summary: Confirmer le sequestre (mainlevee)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fonds liberes avec succes
 */
router.post('/escrow/client/:id/confirm', requireRole(['CLIENT', 'ADMIN']), clientReleaseEscrow);

/**
 * @openapi
 * /payments/escrow/client/{id}/dispute:
 *   post:
 *     tags: [Escrow]
 *     summary: Contester un sequestre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Litige ouvert sur le sequestre
 */
router.post(
  '/escrow/client/:id/dispute',
  requireRole(['CLIENT', 'ADMIN']),
  validateBody(z.object({ reason: z.string().min(1, 'Motif requis') })),
  clientDisputeEscrow
);

/**
 * @openapi
 * /payments/debts/client:
 *   get:
 *     tags: [Dettes]
 *     summary: Lister les dettes du client
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des dettes
 */
router.get('/debts/client', requireRole(['CLIENT', 'ADMIN']), listClientDebts);

/**
 * @openapi
 * /payments/debts/client/{id}/pay:
 *   post:
 *     tags: [Dettes]
 *     summary: Payer une dette
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Paiement enregistre
 */
router.post(
  '/debts/client/:id/pay',
  requireRole(['CLIENT', 'ADMIN']),
  validateBody(
    z.object({
      amount: z.number().positive('Montant invalide'),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  clientPayDebt
);
/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     tags: [Paiements]
 *     summary: Obtenir un paiement par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details du paiement
 *       404:
 *         description: Paiement introuvable
 */
router.get('/:id', requireRole(['CLIENT', 'BUSINESS', 'ADMIN']), getPayment);

/**
 * @openapi
 * /payments/{paymentId}/proof:
 *   post:
 *     tags: [Paiements]
 *     summary: Ajouter une preuve de paiement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Preuve ajoutee avec succes
 */
router.post('/:paymentId/proof', requireRole(['BUSINESS', 'ADMIN']), addPaymentProof);

export default router;
