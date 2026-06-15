import { Router } from 'express';
import {
  listBusinessBookings, getBusinessBooking, createBooking, updateBooking, updateBookingStatus, deleteBooking, getBookingStats,
  listTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot,
  listResources, createResource, updateResource, deleteResource,
  getCalendarBookings, sendReminder,
} from '../controllers/bookings';
import { validateBody } from '../middlewares/validators';
import {
  createBookingSchema, updateBookingSchema, updateBookingStatusSchema,
  createTimeSlotSchema, updateTimeSlotSchema,
  createResourceSchema, updateResourceSchema, sendReminderSchema,
} from '../validators/bookings';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Stats
router.get('/stats', getBookingStats);

// Bookings
router.get('/', listBusinessBookings);
router.post('/', validateBody(createBookingSchema), createBooking);
router.get('/calendar', getCalendarBookings);
router.get('/:id', getBusinessBooking);
router.put('/:id', validateBody(updateBookingSchema), updateBooking);
router.patch('/:id/status', validateBody(updateBookingStatusSchema), updateBookingStatus);
router.delete('/:id', deleteBooking);
router.post('/:id/reminder', validateBody(sendReminderSchema), sendReminder);

// Time Slots
router.get('/slots', listTimeSlots);
router.post('/slots', validateBody(createTimeSlotSchema), createTimeSlot);
router.put('/slots/:id', validateBody(updateTimeSlotSchema), updateTimeSlot);
router.delete('/slots/:id', deleteTimeSlot);

// Resources
router.get('/resources', listResources);
router.post('/resources', validateBody(createResourceSchema), createResource);
router.put('/resources/:id', validateBody(updateResourceSchema), updateResource);
router.delete('/resources/:id', deleteResource);

export default router;
