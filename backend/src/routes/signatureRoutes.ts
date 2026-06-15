import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { createSignatureReq, signDocumentCtrl, verifySignatureCtrl, listSignatureReqs } from '../controllers/signatureController';

const router = Router();

// Public route for signing (no auth needed, accessed via token link)
router.post('/sign/:token', signDocumentCtrl);
router.get('/verify/:documentId', verifySignatureCtrl);

// Protected routes
router.use(authMiddleware);
router.post('/requests', createSignatureReq);
router.get('/requests', listSignatureReqs);

export default router;
