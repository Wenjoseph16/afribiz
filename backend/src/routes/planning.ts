import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  getCalendarFeed,
  listTasks, getTask, createTask, updateTask, deleteTask,
  listSchedules, upsertSchedule, deleteSchedule,
  listPlanningLogs, getPlanningStats,
} from '../controllers/planning';
import { createTaskSchema, updateTaskSchema, upsertScheduleSchema } from '../validators/planning';

const router = Router();

router.use(authMiddleware);

// Calendar feed (aggregated view)
router.get('/calendar', getCalendarFeed);

// Tasks
router.get('/tasks', listTasks);
router.get('/tasks/:id', getTask);
router.post('/tasks', validateBody(createTaskSchema), createTask);
router.patch('/tasks/:id', validateBody(updateTaskSchema), updateTask);
router.delete('/tasks/:id', deleteTask);

// Employee schedules
router.get('/schedules', listSchedules);
router.post('/schedules', validateBody(upsertScheduleSchema), upsertSchedule);
router.put('/schedules', validateBody(upsertScheduleSchema), upsertSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Planning logs & stats
router.get('/logs', listPlanningLogs);
router.get('/stats', getPlanningStats);

export default router;
