import { Router } from 'express';
import { listServices, getService, createService, updateService, deleteService, toggleServiceActive, getServiceStats, duplicateService, exportServices, importServices, bulkDeleteServices, bulkToggleServices, listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/service';
import { validateBody } from '../middlewares/validators';
import { createServiceSchema, updateServiceSchema, createCategorySchema, updateCategorySchema } from '../validators/service';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/', listServices);
router.get('/stats', getServiceStats);
router.get('/export', exportServices);
router.post('/import', importServices);
router.post('/bulk/delete', bulkDeleteServices);
router.patch('/bulk/toggle', bulkToggleServices);
router.get('/categories', listCategories);
router.post('/categories', validateBody(createCategorySchema), createCategory);
router.put('/categories/:id', validateBody(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/:id', getService);
router.post('/', validateBody(createServiceSchema), createService);
router.put('/:id', validateBody(updateServiceSchema), updateService);
router.delete('/:id', deleteService);
router.patch('/:id/toggle', toggleServiceActive);
router.post('/:id/duplicate', duplicateService);

export default router;
