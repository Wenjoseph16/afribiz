import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listEvents, getEvent, createEvent, updateEvent, deleteEvent,
  createTicket, updateTicket, deleteTicket,
  listParticipants, registerParticipant, updateParticipantStatus,
  scanTicket, listScans,
  listTickets,
  listPromotions, createPromotion, deletePromotion,
  listGallery, addGalleryItem, deleteGalleryItem,
  listPartners, addPartner, removePartner,
  getEventStats, getDashboardStats,
} from '../controllers/events';

const router = Router();
router.use(authMiddleware);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Event stats (must be before /:id)
router.get('/:id/stats', getEventStats);

// Sub-resources under event (must be before /:id)
router.get('/:id/tickets', listTickets);
router.post('/:id/tickets', createTicket);
router.patch('/:id/tickets/:ticketId', updateTicket);
router.delete('/:id/tickets/:ticketId', deleteTicket);

router.get('/:id/participants', listParticipants);
router.post('/:id/participants', registerParticipant);
router.patch('/:id/participants/:participantId/status', updateParticipantStatus);

router.post('/:id/scan', scanTicket);
router.get('/:id/scans', listScans);

router.get('/:id/promotions', listPromotions);
router.post('/:id/promotions', createPromotion);
router.delete('/:id/promotions/:promoId', deletePromotion);

router.get('/:id/gallery', listGallery);
router.post('/:id/gallery', addGalleryItem);
router.delete('/:id/gallery/:itemId', deleteGalleryItem);

router.get('/:id/partners', listPartners);
router.post('/:id/partners', addPartner);
router.delete('/:id/partners/:partnerId', removePartner);

// CRUD events
router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:id', getEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
