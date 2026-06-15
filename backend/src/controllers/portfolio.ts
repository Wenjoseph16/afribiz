import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as portfolioService from '../services/portfolio';

export const listPortfolioItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await portfolioService.listPortfolioItems(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getPortfolioItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const item = await portfolioService.getPortfolioItem(req.user.id, req.params.id);
  res.json({ success: true, data: item });
});

export const createPortfolioItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const item = await portfolioService.createPortfolioItem(req.user.id, req.body);
  res.status(201).json({ success: true, data: item, message: 'Élément portfolio créé' });
});

export const updatePortfolioItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const item = await portfolioService.updatePortfolioItem(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: item, message: 'Élément mis à jour' });
});

export const deletePortfolioItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await portfolioService.deletePortfolioItem(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listPortfolioCategories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const categories = await portfolioService.listPortfolioCategories(req.user.id);
  res.json({ success: true, data: categories });
});

export const createPortfolioCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const category = await portfolioService.createPortfolioCategory(req.user.id, req.body);
  res.status(201).json({ success: true, data: category, message: 'Catégorie créée' });
});

export const updatePortfolioCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const category = await portfolioService.updatePortfolioCategory(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: category, message: 'Catégorie mise à jour' });
});

export const deletePortfolioCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await portfolioService.deletePortfolioCategory(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const addPortfolioMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const media = await portfolioService.addPortfolioMedia(req.user.id, req.body);
  res.status(201).json({ success: true, data: media, message: 'Média ajouté' });
});

export const deletePortfolioMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await portfolioService.deletePortfolioMedia(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listPortfolioTestimonials = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const testimonials = await portfolioService.listPortfolioTestimonials(req.user.id, req.query);
  res.json({ success: true, data: testimonials });
});

export const createPortfolioTestimonial = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const testimonial = await portfolioService.createPortfolioTestimonial(req.user.id, req.body);
  res.status(201).json({ success: true, data: testimonial, message: 'Témoignage ajouté' });
});

export const updatePortfolioTestimonial = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const testimonial = await portfolioService.updatePortfolioTestimonial(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: testimonial, message: 'Témoignage mis à jour' });
});

export const deletePortfolioTestimonial = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await portfolioService.deletePortfolioTestimonial(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const recordInteraction = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const interaction = await portfolioService.recordInteraction(req.user.id, req.body);
  res.status(201).json({ success: true, data: interaction });
});

export const getPortfolioStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const stats = await portfolioService.getPortfolioStats(req.user.id);
  res.json({ success: true, data: stats });
});
