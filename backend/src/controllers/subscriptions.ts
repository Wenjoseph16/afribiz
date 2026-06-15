import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as subscriptionService from '../services/subscriptions';

export const listSubscriptionPlans = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await subscriptionService.listSubscriptionPlans(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const plan = await subscriptionService.getSubscriptionPlan(req.user.id, req.params.id);
  res.json({ success: true, data: plan });
});

export const createSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const plan = await subscriptionService.createSubscriptionPlan(req.user.id, req.body);
  res.status(201).json({ success: true, data: plan, message: 'Plan crée' });
});

export const updateSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const plan = await subscriptionService.updateSubscriptionPlan(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: plan, message: 'Plan mis à jour' });
});

export const deleteSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await subscriptionService.deleteSubscriptionPlan(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listSubscribers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await subscriptionService.listSubscribers(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getSubscriber = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.getSubscriber(req.user.id, req.params.id);
  res.json({ success: true, data: subscription });
});

export const createSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.createSubscription(req.user.id, req.body);
  res.status(201).json({ success: true, data: subscription, message: 'Abonnement créé' });
});

export const cancelSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.cancelSubscription(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: subscription, message: 'Abonnement annulé' });
});

export const renewSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.renewSubscription(req.user.id, req.params.id);
  res.json({ success: true, data: subscription, message: 'Abonnement renouvelé' });
});

export const listSubscriptionPayments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await subscriptionService.listSubscriptionPayments(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const recordSubscriptionPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const payment = await subscriptionService.recordSubscriptionPayment(req.user.id, req.body);
  res.status(201).json({ success: true, data: payment, message: 'Paiement enregistré' });
});

export const listSubscriptionLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await subscriptionService.listSubscriptionLogs(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getSubscriptionStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const stats = await subscriptionService.getSubscriptionStats(req.user.id);
  res.json({ success: true, data: stats });
});

export const getMySubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.getMyCurrentSubscription(req.user.id);
  res.json({ success: true, data: subscription });
});

export const subscribeToPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.subscribeToPlan(req.user.id, req.body);
  res.status(201).json({ success: true, data: subscription, message: 'Abonnement souscrit avec succès' });
});

export const cancelMySubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const subscription = await subscriptionService.cancelMySubscription(req.user.id);
  res.json({ success: true, data: subscription, message: 'Abonnement annulé' });
});
