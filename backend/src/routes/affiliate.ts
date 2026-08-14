import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { createLink, listLinks, deleteLink, resolveLink } from '../controllers/affiliateController';

const router = Router();

// Public : que pointe ce lien d'affiliation ? (avant auth — le partage se fait hors connexion)
router.get('/resolve', resolveLink);

// Routes business authentifiées
router.use(authMiddleware);
router.post('/', createLink);
router.get('/', listLinks);
router.delete('/:id', deleteLink);

export default router;
