import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController';

const router = Router();
router.use(authMiddleware);

router.get('/', listSuppliers);
router.post('/', createSupplier);
router.patch('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
