import { Router } from 'express';
import { authMiddleware, requireEmployeePermission } from '../middlewares/auth';
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
  listStages,
  createStage,
  updateStage,
  deleteStage,
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  moveDeal,
  deleteDeal,
  getPipelineStats,
  seedDefaultStages,
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
import {
  createStageSchema,
  updateStageSchema,
  createDealSchema,
  updateDealSchema,
  moveDealSchema,
} from '../validators/pipeline';

const router = Router();

router.use(authMiddleware);
router.use(requireEmployeePermission(['REPLY_CLIENTS']));

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

router.post(
  '/clients/:clientId/segments',
  validateBody(assignClientToSegmentSchema),
  assignClientToSegment
);
router.delete('/clients/:clientId/segments/:segmentId', removeClientFromSegment);

// ===== Pipeline =====
router.post('/pipeline/seed', seedDefaultStages);
router.get('/pipeline/stats', getPipelineStats);
router.get('/pipeline/stages', listStages);
router.post('/pipeline/stages', validateBody(createStageSchema), createStage);
router.put('/pipeline/stages/:stageId', validateBody(updateStageSchema), updateStage);
router.delete('/pipeline/stages/:stageId', deleteStage);
router.get('/pipeline/deals', listDeals);
router.get('/pipeline/deals/:dealId', getDeal);
router.post('/pipeline/deals', validateBody(createDealSchema), createDeal);
router.put('/pipeline/deals/:dealId', validateBody(updateDealSchema), updateDeal);
router.patch('/pipeline/deals/:dealId/move', validateBody(moveDealSchema), moveDeal);
router.delete('/pipeline/deals/:dealId', deleteDeal);

export default router;
