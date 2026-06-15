import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as adsService from '../services/ads';

export const createCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const data = req.body;
  const campaign = await adsService.createAdCampaign(userId, data);
  res.status(201).json({ success: true, data: campaign });
});

export const getMyCampaigns = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.primaryRole;
  const filters = req.query;
  const campaigns = await adsService.getMyCampaigns(userId, role, filters);
  res.json({ success: true, data: campaigns });
});

export const getCampaignById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const campaign = await adsService.getAdCampaignById(id);
  res.json({ success: true, data: campaign });
});

export const pauseCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const campaign = await adsService.pauseAdCampaign(id, userId);
  res.json({ success: true, data: campaign });
});

export const resumeCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const campaign = await adsService.resumeAdCampaign(id, userId);
  res.json({ success: true, data: campaign });
});

export const updateCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const data = req.body;
  const campaign = await adsService.updateAdCampaign(id, userId, data);
  res.json({ success: true, data: campaign });
});

export const deleteCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  await adsService.deleteAdCampaign(id, userId);
  res.json({ success: true, data: null });
});

export const getActiveAds = catchAsyncErrors(async (req: Request, res: Response) => {
  const { page, position, country } = req.query;
  const ads = await adsService.getActiveAdCreatives(page as string, position as string, country as string);
  res.json({ success: true, data: ads });
});

export const trackImpression = catchAsyncErrors(async (req: Request, res: Response) => {
  const { campaignId, ...data } = req.body;
  const impression = await adsService.trackImpression(campaignId, data);
  res.status(201).json({ success: true, data: impression });
});

export const trackClick = catchAsyncErrors(async (req: Request, res: Response) => {
  const { campaignId, ...data } = req.body;
  const click = await adsService.trackClick(campaignId, data);
  res.status(201).json({ success: true, data: click });
});

export const getAdStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const stats = await adsService.getAdStats(id);
  res.json({ success: true, data: stats });
});

export const adminGetAllCampaigns = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const filters = req.query;
  const campaigns = await adsService.getAllAdCampaigns(filters);
  res.json({ success: true, data: campaigns });
});

export const adminValidateCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id } = req.params;
  const campaign = await adsService.validateAdCampaign(id, adminId);
  res.json({ success: true, data: campaign });
});

export const adminRejectCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const campaign = await adsService.rejectAdCampaign(id, reason);
  res.json({ success: true, data: campaign });
});

export const adminSuspendCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const campaign = await adsService.suspendAdCampaign(id, reason);
  res.json({ success: true, data: campaign });
});

export const adminGetStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await adsService.getAdRevenue();
  res.json({ success: true, data: stats });
});

export const adminGetPackages = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const packages = await adsService.getAdPackages();
  res.json({ success: true, data: packages });
});

export const adminCreatePackage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const pkg = await adsService.createAdPackage(data);
  res.status(201).json({ success: true, data: pkg });
});

export const adminUpdatePackage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const pkg = await adsService.updateAdPackage(id, data);
  res.json({ success: true, data: pkg });
});

export const adminGetRevenue = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const revenue = await adsService.getAdRevenue();
  res.json({ success: true, data: revenue });
});

export const generateInvoice = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const invoice = await adsService.generateInvoice(id);
  res.status(201).json({ success: true, data: invoice });
});

export const reportAd = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { campaignId, reason, reporterEmail, details } = req.body;
  await adsService.reportAd(campaignId, { reason, reporterEmail, details });
  res.json({ success: true, message: 'Signalement envoyé avec succès' });
});
