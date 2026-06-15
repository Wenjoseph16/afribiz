import { Router } from 'express';
import { listRooms, getRoom, createRoom, updateRoom, deleteRoom, toggleRoomActive, updateRoomStatus, blockRoomDates, getRoomStats, duplicateRoom, exportRooms, importRooms, bulkDeleteRooms, bulkToggleRooms } from '../controllers/room';
import { validateBody } from '../middlewares/validators';
import { createRoomSchema, updateRoomSchema, updateRoomStatusSchema, blockRoomDatesSchema } from '../validators/room';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/', listRooms);
router.get('/stats', getRoomStats);
router.get('/export', exportRooms);
router.post('/import', importRooms);
router.post('/bulk/delete', bulkDeleteRooms);
router.patch('/bulk/toggle', bulkToggleRooms);
router.post('/', validateBody(createRoomSchema), createRoom);
router.get('/:id', getRoom);
router.put('/:id', validateBody(updateRoomSchema), updateRoom);
router.delete('/:id', deleteRoom);
router.patch('/:id/toggle', toggleRoomActive);
router.patch('/:id/status', validateBody(updateRoomStatusSchema), updateRoomStatus);
router.post('/:id/block', validateBody(blockRoomDatesSchema), blockRoomDates);
router.post('/:id/duplicate', duplicateRoom);

export default router;
