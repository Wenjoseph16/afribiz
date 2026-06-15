import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  createPortfolioItemSchema, updatePortfolioItemSchema,
  createCategorySchema, updateCategorySchema,
  addMediaSchema,
  createTestimonialSchema, updateTestimonialSchema,
  recordInteractionSchema,
} from '../validators/portfolio';
import {
  listPortfolioItems, getPortfolioItem, createPortfolioItem, updatePortfolioItem, deletePortfolioItem,
  listPortfolioCategories, createPortfolioCategory, updatePortfolioCategory, deletePortfolioCategory,
  addPortfolioMedia, deletePortfolioMedia,
  listPortfolioTestimonials, createPortfolioTestimonial, updatePortfolioTestimonial, deletePortfolioTestimonial,
  recordInteraction, getPortfolioStats,
} from '../controllers/portfolio';

const router = Router();
router.use(authMiddleware);

// Stats (must be before /:id)
router.get('/stats', getPortfolioStats);

// Categories (static paths before /:id)
router.get('/categories', listPortfolioCategories);
router.post('/categories', validateBody(createCategorySchema), createPortfolioCategory);
router.patch('/categories/:id', validateBody(updateCategorySchema), updatePortfolioCategory);
router.delete('/categories/:id', deletePortfolioCategory);

// Media
router.post('/media', validateBody(addMediaSchema), addPortfolioMedia);
router.delete('/media/:id', deletePortfolioMedia);

// Testimonials
router.get('/testimonials', listPortfolioTestimonials);
router.post('/testimonials', validateBody(createTestimonialSchema), createPortfolioTestimonial);
router.patch('/testimonials/:id', validateBody(updateTestimonialSchema), updatePortfolioTestimonial);
router.delete('/testimonials/:id', deletePortfolioTestimonial);

// Interactions
router.post('/interactions', validateBody(recordInteractionSchema), recordInteraction);

// Items CRUD (/:id must be last)
router.get('/', listPortfolioItems);
router.get('/:id', getPortfolioItem);
router.post('/', validateBody(createPortfolioItemSchema), createPortfolioItem);
router.patch('/:id', validateBody(updatePortfolioItemSchema), updatePortfolioItem);
router.delete('/:id', deletePortfolioItem);

export default router;
