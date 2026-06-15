import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listDocuments, getDocument, createDocument,
  updateDocument, deleteDocument, getDocumentStats,
} from '../controllers/documentBusiness';

const router = Router();
router.use(authMiddleware);

router.get('/stats', getDocumentStats);
router.get('/', listDocuments);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
