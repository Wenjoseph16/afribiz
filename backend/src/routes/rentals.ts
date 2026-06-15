import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listRentals, getRental, createRental, updateRental, deleteRental,
  toggleRentalActive, getRentalStats, downloadRentalContract,
} from '../controllers/rentals';

const router = Router();
router.use(authMiddleware);

router.get('/stats', getRentalStats);
router.get('/', listRentals);
router.get('/:id', getRental);
router.post('/', createRental);
router.patch('/:id', updateRental);
router.patch('/:id/toggle', toggleRentalActive);
router.delete('/:id', deleteRental);
router.get('/:id/contract', downloadRentalContract);

export default router;
