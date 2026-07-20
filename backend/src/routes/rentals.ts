import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  listRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  toggleRentalActive,
  getRentalStats,
  downloadRentalContract,
  createRentalBooking,
  prolongRentalBooking,
} from '../controllers/rentals';

const router = Router();
router.use(authMiddleware);

// Client-accessible booking routes (BEFORE the BUSINESS/ADMIN guard)
router.post('/bookings', createRentalBooking);
router.post('/bookings/:id/prolong', prolongRentalBooking);

// Routes réservées aux BUSINESS/ADMIN
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/stats', getRentalStats);
router.get('/', listRentals);
router.get('/:id', getRental);
router.post('/', createRental);
router.patch('/:id', updateRental);
router.patch('/:id/toggle', toggleRentalActive);
router.delete('/:id', deleteRental);
router.get('/:id/contract', downloadRentalContract);

export default router;
