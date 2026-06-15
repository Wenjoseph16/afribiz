import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { z } from 'zod';
import { rescheduleBookingSchema } from '../validators/client';
import { getMyBookings, getMyBooking, cancelMyBooking, rescheduleMyBooking } from '../controllers/bookings';
import { createRentalBooking, prolongRentalBooking } from '../controllers/rentals';

const router = Router();
router.use(authMiddleware);

router.get('/', getMyBookings);
router.get('/:id', getMyBooking);
router.post('/:id/cancel', cancelMyBooking);
router.put('/:id/reschedule', validateBody(rescheduleBookingSchema), rescheduleMyBooking);

router.post('/rental', validateBody(z.object({
  rentalId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
})), createRentalBooking);

router.post('/:id/prolong', validateBody(z.object({
  newEndDate: z.string(),
  additionalNotes: z.string().optional(),
})), prolongRentalBooking);

export default router;
