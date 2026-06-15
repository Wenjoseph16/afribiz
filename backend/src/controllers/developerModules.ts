import { Request, Response, NextFunction } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as developerModulesService from '../services/developerModules';

export const createModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const module = await developerModulesService.createModule(req.user.id, req.body);
  res.status(201).json({ success: true, data: module, message: 'Module créé avec succès' });
});

export const updateModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const module = await developerModulesService.updateModule(id, req.user.id, req.body);
  res.json({ success: true, data: module, message: 'Module mis à jour avec succès' });
});

export const publishModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const module = await developerModulesService.publishModule(id, req.user.id);
  res.json({ success: true, data: module, message: 'Module publié avec succès' });
});

export const archiveModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const module = await developerModulesService.archiveModule(id, req.user.id);
  res.json({ success: true, data: module, message: 'Module archivé avec succès' });
});

export const getDeveloperModules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const status = req.query.status as string | undefined;
  const modules = await developerModulesService.getDeveloperModules(req.user.id, status);
  res.json({ success: true, data: modules });
});

export const getModuleById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const module = await developerModulesService.getModuleById(id);
  res.json({ success: true, data: module });
});

export const getModuleBySlug = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const module = await developerModulesService.getModuleBySlug(slug);
  res.json({ success: true, data: module });
});

export const getMarketplaceModules = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { category, search, sort } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await developerModulesService.getMarketplaceModules(
    category as string | undefined,
    search as string | undefined,
    sort as string | undefined,
    page,
    limit
  );
  res.json({ success: true, data: result });
});

export const startTrial = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const result = await developerModulesService.startTrial(id, req.user.id);
  res.json({ success: true, data: result, message: 'Essai gratuit commencé' });
});

export const purchaseModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const { provider, phone } = req.body;
  if (!provider || !phone) {
    return res.status(400).json({ success: false, error: 'Fournisseur de paiement et numéro de téléphone requis' });
  }
  const result = await developerModulesService.purchaseModule(id, req.user.id, { provider, phone });
  res.json({ success: true, data: result });
});

export const confirmModulePayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { providerRef } = req.body;
  if (!providerRef) {
    return res.status(400).json({ success: false, error: 'Référence de transaction requise' });
  }
  const result = await developerModulesService.confirmModulePayment(req.user.id, providerRef);
  res.json({ success: true, data: result, message: 'Installation confirmée avec succès' });
});

export const installModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const module = await developerModulesService.getModuleById(id);
  const price = Number((module as any).price) || 0;
  if (price > 0 && !(module as any).isFree) {
    return res.status(402).json({
      success: false,
      error: 'Ce module est payant. Veuillez utiliser le endpoint /purchase pour payer et installer.',
      data: { moduleId: id, price, requiresPayment: true },
    });
  }
  const installation = await developerModulesService.installModule(id, req.user.id);
  res.json({ success: true, data: installation, message: 'Module installé avec succès' });
});

export const uninstallModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const result = await developerModulesService.uninstallModule(id);
  res.json({ success: true, data: result, message: 'Module désinstallé avec succès' });
});

export const createModuleVersion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const version = await developerModulesService.createModuleVersion(id, req.body);
  res.status(201).json({ success: true, data: version, message: 'Version créée avec succès' });
});

export const getModuleVersions = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const versions = await developerModulesService.getModuleVersions(id);
  res.json({ success: true, data: versions });
});

export const createReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const review = await developerModulesService.createReview(id, req.user.id, req.body);
  res.status(201).json({ success: true, data: review, message: 'Avis soumis avec succès' });
});

export const getModuleReviews = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const reviews = await developerModulesService.getModuleReviews(id);
  res.json({ success: true, data: reviews });
});

export const respondToReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const review = await developerModulesService.respondToReview(id, req.user.id, req.body.response);
  res.json({ success: true, data: review, message: 'Réponse soumise avec succès' });
});

export const createTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const ticket = await developerModulesService.createTicket(req.user.id, req.body);
  res.status(201).json({ success: true, data: ticket, message: 'Ticket créé avec succès' });
});

export const getMyTickets = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const tickets = await developerModulesService.getMyTickets(req.user.id);
  res.json({ success: true, data: tickets });
});

export const getTicketById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const ticket = await developerModulesService.getTicketById(id, req.user.id);
  res.json({ success: true, data: ticket });
});

export const replyToTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const message = await developerModulesService.replyToTicket(id, req.user.id, req.body.content);
  res.json({ success: true, data: message, message: 'Message envoyé avec succès' });
});

export const updateTicketStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const ticket = await developerModulesService.updateTicketStatus(id, req.user.id, req.body.status);
  res.json({ success: true, data: ticket, message: 'Statut du ticket mis à jour avec succès' });
});

export const getInstallations = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const data = await developerModulesService.getDeveloperInstallations(req.user.id, req.query.status as string);
  res.json({ success: true, data });
});

export const getOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const data = await developerModulesService.getDeveloperOrders(req.user.id, {
    type: req.query.type as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json({ success: true, data: data.data, pagination: { total: data.total, page: data.page, totalPages: data.totalPages } });
});

export const getSubscriptions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const data = await developerModulesService.getDeveloperSubscriptions(req.user.id);
  res.json({ success: true, data });
});

export const getRevenueHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const revenues = await developerModulesService.getRevenueHistory(req.user.id);
  res.json({ success: true, data: revenues });
});

export const getRevenueSummary = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const summary = await developerModulesService.getRevenueSummary(req.user.id);
  res.json({ success: true, data: summary });
});

export const getPayoutHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const payouts = await developerModulesService.getPayoutHistory(req.user.id);
  res.json({ success: true, data: payouts });
});

export const uploadModuleImages = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  const updates: Record<string, any> = {};

  // Handle logo upload (single file)
  if (files?.logo && files.logo.length > 0) {
    const logoFile = files.logo[0];
    updates.logo = `/uploads/${logoFile.filename}`;
  }

  // Handle screenshots upload (multiple files)
  if (files?.screenshots && files.screenshots.length > 0) {
    updates.images = files.screenshots.map((f) => `/uploads/${f.filename}`);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
  }

  const updated = await developerModulesService.updateModule(id, req.user.id, updates);
  res.json({ success: true, data: updated, message: 'Images mises à jour avec succès' });
});

export const requestPayout = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const payout = await developerModulesService.requestPayout(req.user.id, req.body);
  res.status(201).json({ success: true, data: payout, message: 'Demande de paiement soumise avec succès' });
});
