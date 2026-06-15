import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { createTaskSchema, updateTaskSchema } from '../validators/planning';
import {
  createChecklistItemSchema, addCommentSchema, addResourceSchema,
  requestValidationSchema, approveValidationSchema, createTaskCategorySchema, reorderTaskSchema,
} from '../validators/advancedTasks';
import {
  listTasks, getTask, createTask, updateTask, deleteTask, reorderTask,
  getKanbanBoard, listCategories, createCategory,
  addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  addComment, deleteComment, startTimer, stopTimer,
  addResource, deleteResource, requestValidation, approveValidation,
  getTaskStats, listTaskHistory,
} from '../controllers/advancedTasks';

const router = Router();
router.use(authMiddleware);

router.get('/kanban', getKanbanBoard);
router.get('/tasks', listTasks);
router.get('/tasks/stats', getTaskStats);
router.get('/tasks/:id', getTask);
router.post('/tasks', validateBody(createTaskSchema), createTask);
router.patch('/tasks/:id', validateBody(updateTaskSchema), updateTask);
router.delete('/tasks/:id', deleteTask);
router.patch('/tasks/:id/reorder', validateBody(reorderTaskSchema), reorderTask);
router.get('/categories', listCategories);
router.post('/categories', validateBody(createTaskCategorySchema), createCategory);
router.post('/tasks/:id/checklist', validateBody(createChecklistItemSchema), addChecklistItem);
router.patch('/tasks/:id/checklist/:itemId', toggleChecklistItem);
router.delete('/tasks/:id/checklist/:itemId', deleteChecklistItem);
router.post('/tasks/:id/comments', validateBody(addCommentSchema), addComment);
router.delete('/tasks/:id/comments/:commentId', deleteComment);
router.post('/tasks/:id/timer/start', startTimer);
router.post('/tasks/:id/timer/stop', stopTimer);
router.post('/tasks/:id/resources', validateBody(addResourceSchema), addResource);
router.delete('/tasks/:id/resources/:resourceId', deleteResource);
router.post('/tasks/:id/validations', validateBody(requestValidationSchema), requestValidation);
router.patch('/tasks/:id/validations/:validationId', validateBody(approveValidationSchema), approveValidation);
router.get('/tasks/:id/history', listTaskHistory);

export default router;
