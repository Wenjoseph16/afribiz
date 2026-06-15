import { Router } from 'express';
import {
  listPartners, getPartner, createPartner, updatePartner, deletePartner,
  getPartnerStats, getPublicPartners,
  listContracts, createContract, updateContract, signContract,
  listTransactions, createTransaction,
  listAssignments, createAssignment, updateAssignment,
  listReviews, createReview,
  listDocuments, createDocument, deleteDocument,
  listPermissions, createPermission, updatePermission, deletePermission,
  getPartnerAnalytics,
} from '../controllers/partner';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

// Public routes (no auth)
router.get('/public/:slug', getPublicPartners);

// Protected routes
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Stats & Analytics
router.get('/stats', getPartnerStats);
router.get('/analytics', getPartnerAnalytics);

// Partners CRUD
router.get('/', listPartners);
router.post('/', createPartner);
router.get('/:id', getPartner);
router.put('/:id', updatePartner);
router.delete('/:id', deletePartner);

// Contracts
router.get('/contracts/list', listContracts);
router.post('/contracts', createContract);
router.put('/contracts/:id', updateContract);
router.post('/contracts/:id/sign', signContract);

// Transactions
router.get('/transactions/list', listTransactions);
router.post('/transactions', createTransaction);

// Assignments
router.get('/assignments/list', listAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);

// Reviews
router.get('/reviews/list', listReviews);
router.post('/reviews', createReview);

// Documents
router.get('/documents/list', listDocuments);
router.post('/documents', createDocument);
router.delete('/documents/:id', deleteDocument);

// Permissions
router.get('/permissions/list', listPermissions);
router.post('/permissions', createPermission);
router.put('/permissions/:id', updatePermission);
router.delete('/permissions/:id', deletePermission);

export default router;
