import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  getCrmDashboardStats,
  listClients,
  getClientDetail,
  createNote,
  updateNote,
  deleteNote,
  listTags,
  createTag,
  deleteTag,
  assignTag,
  removeTag,
  listSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  assignClientToSegment,
  removeClientFromSegment,
  recalculateSegment,
  syncClientVisit,
} from '../controllers/crm';
import {
  createTagSchema,
  createNoteSchema,
  updateNoteSchema,
  createSegmentSchema,
  updateSegmentSchema,
  assignTagToClientSchema,
  assignClientToSegmentSchema,
} from '../validators/crm';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getCrmDashboardStats);

router.get('/clients', listClients);
router.get('/clients/:clientId', getClientDetail);
router.post('/clients/:clientId/notes', validateBody(createNoteSchema), createNote);
router.put('/clients/notes/:noteId', validateBody(updateNoteSchema), updateNote);
router.delete('/clients/notes/:noteId', deleteNote);
router.put('/clients/:clientId/visit', syncClientVisit);

router.post('/clients/:clientId/tags', validateBody(assignTagToClientSchema), assignTag);
router.delete('/clients/:clientId/tags/:tagId', removeTag);

router.get('/tags', listTags);
router.post('/tags', validateBody(createTagSchema), createTag);
router.delete('/tags/:tagId', deleteTag);

router.get('/segments', listSegments);
router.post('/segments', validateBody(createSegmentSchema), createSegment);
router.put('/segments/:segmentId', validateBody(updateSegmentSchema), updateSegment);
router.delete('/segments/:segmentId', deleteSegment);
router.post('/segments/:segmentId/recalculate', recalculateSegment);

router.post('/clients/:clientId/segments', validateBody(assignClientToSegmentSchema), assignClientToSegment);
router.delete('/clients/:clientId/segments/:segmentId', removeClientFromSegment);

export default router;
