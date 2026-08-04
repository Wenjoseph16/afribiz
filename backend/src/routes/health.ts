import { createRouter } from '../middlewares/createRouter';
import {
  healthCheck,
  healthDb,
  healthRedis,
  healthStorage,
  maintenanceStatus,
  testEmail,
} from '../controllers/health';

const router = createRouter();

router.get('/', healthCheck);
router.get('/db', healthDb);
router.get('/redis', healthRedis);
router.get('/storage', healthStorage);
router.post('/test-email', testEmail);

export default router;
