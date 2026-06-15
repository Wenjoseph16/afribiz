import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listDeliveryZones, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone,
  listDrivers, createDriver, updateDriver, deleteDriver,
  listDeliveries, getDelivery, createDelivery, updateDelivery,
  assignDriver, updateDeliveryStatus,
  addTrackingEvent, addDeliveryProof, getDeliveryStats,
} from '../controllers/delivery';
import {
  createDeliveryZoneSchema, updateDeliveryZoneSchema,
  createDriverSchema, updateDriverSchema,
  createDeliverySchema, updateDeliverySchema,
  assignDriverSchema, updateDeliveryStatusSchema,
  addTrackingEventSchema, addDeliveryProofSchema,
} from '../validators/delivery';

const router = Router();
router.use(authMiddleware);

// Stats (must be before :id routes)
router.get('/stats', getDeliveryStats);

// Zones
router.get('/zones', listDeliveryZones);
router.post('/zones', validateBody(createDeliveryZoneSchema), createDeliveryZone);
router.patch('/zones/:id', validateBody(updateDeliveryZoneSchema), updateDeliveryZone);
router.delete('/zones/:id', deleteDeliveryZone);

// Drivers
router.get('/drivers', listDrivers);
router.post('/drivers', validateBody(createDriverSchema), createDriver);
router.patch('/drivers/:id', validateBody(updateDriverSchema), updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Tracking & Proofs (must be before /:id)
router.post('/:id/tracking', validateBody(addTrackingEventSchema), addTrackingEvent);
router.post('/:id/proofs', validateBody(addDeliveryProofSchema), addDeliveryProof);
router.post('/:id/assign', validateBody(assignDriverSchema), assignDriver);
router.patch('/:id/status', validateBody(updateDeliveryStatusSchema), updateDeliveryStatus);

// CRUD deliveries
router.get('/', listDeliveries);
router.post('/', validateBody(createDeliverySchema), createDelivery);
router.get('/:id', getDelivery);
router.patch('/:id', validateBody(updateDeliverySchema), updateDelivery);
// delete handled via status: CANCELLED

export default router;
