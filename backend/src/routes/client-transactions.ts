import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getUnifiedTransactions, getUnifiedTransaction } from '../services/trackingService';
import { TransactionType } from '../types/tracking';
import { logger } from '../lib/logger';

const router = Router();
router.use(authMiddleware);

// GET /api/transactions — list all transactions (unified)
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const typesParam = req.query.types as string | undefined;
    const types = typesParam ? (typesParam.split(',') as TransactionType[]) : undefined;

    const result = await getUnifiedTransactions(userId, {
      types,
      statuses: req.query.statuses ? (req.query.statuses as string).split(',') : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sortBy: req.query.sortBy as 'createdAt' | 'updatedAt' | 'amount',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Error fetching unified transactions:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des transactions' });
  }
});

// GET /api/transactions/:type/:id — get single transaction detail
router.get('/:type/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;

    const validTypes: TransactionType[] = [
      'ORDER',
      'BOOKING',
      'RENTAL',
      'EVENT',
      'SUBSCRIPTION',
      'TRAINING',
      'LAYAWAY',
    ];
    if (!validTypes.includes(type.toUpperCase() as TransactionType)) {
      return res.status(400).json({ success: false, error: 'Type de transaction invalide' });
    }

    const transaction = await getUnifiedTransaction(
      userId,
      type.toUpperCase() as TransactionType,
      id
    );
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    logger.error('Error fetching transaction detail:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du chargement de la transaction' });
  }
});

export default router;
