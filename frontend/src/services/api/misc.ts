import type { ApiClientMethods } from './api-client.types';

export function injectMisc(api: ApiClientMethods) {
  // Business Training methods (auth)
  api.getBizTrainings = function (params?: any) {
    return this.get('/trainings/business', { params });
  };
  api.getBizTraining = function (id: string) {
    return this.get(`/trainings/business/${id}`);
  };
  api.createBizTraining = function (data: any) {
    return this.post('/trainings/business', data);
  };
  api.updateBizTraining = function (id: string, data: any) {
    return this.patch(`/trainings/business/${id}`, data);
  };
  api.deleteBizTraining = function (id: string) {
    return this.delete(`/trainings/business/${id}`);
  };
  api.getBizTrainingStudents = function (trainingId: string, params?: any) {
    return this.get(`/trainings/business/${trainingId}/students`, { params });
  };
  api.getBizTrainingStats = function () {
    return this.get('/trainings/business/stats');
  };
  api.getBizTrainingLessons = function (trainingId: string) {
    return this.get(`/trainings/business/${trainingId}/lessons`);
  };
  api.createBizTrainingLesson = function (data: any) {
    return this.post('/trainings/business/lessons', data);
  };
  api.updateBizTrainingLesson = function (id: string, data: any) {
    return this.patch(`/trainings/business/lessons/${id}`, data);
  };
  api.deleteBizTrainingLesson = function (id: string) {
    return this.delete(`/trainings/business/lessons/${id}`);
  };
  api.createBizTrainingQuiz = function (data: any) {
    return this.post('/trainings/business/quiz', data);
  };
  api.deleteBizTrainingQuiz = function (quizId: string) {
    return this.delete(`/trainings/business/quiz/${quizId}`);
  };
  // Alerts
  api.getAlerts = function (params?: any) {
    return this.get('/alerts', { params });
  };
  api.markAlertRead = function (id: string) {
    return this.patch(`/alerts/${id}/read`);
  };
  api.deleteAlert = function (id: string) {
    return this.delete(`/alerts/${id}`);
  };
  // Attention
  api.getAttentionItems = function (params?: any) {
    return this.get('/attention/center', { params });
  };
  // Client Intelligence
  api.getClientIntelligence = function (businessId: string) {
    return this.get(`/client-intelligence/${businessId}`);
  };
  // Comments
  api.getComments = function (targetType: string, targetId: string, params?: any) {
    return this.get(`/comments/${targetType}/${targetId}`, { params });
  };
  api.deleteComment = function (id: string) {
    return this.delete(`/comments/${id}`);
  };
  // Content Reports
  api.getContentReports = function (params?: any) {
    return this.get('/reports', { params });
  };
  api.resolveContentReport = function (id: string, action: string) {
    return this.post(`/reports/${id}/resolve`, { action });
  };
  // Gamification
  api.getGamification = function () {
    return this.get('/gamification/dashboard');
  };
  api.getLeaderboard = function () {
    return this.get('/gamification/leaderboard');
  };
  // Growth Coaching
  api.getGrowthCoaching = function (params?: any) {
    return this.get('/growth-coaching/coach', { params });
  };
  // Growth Engine
  api.getGrowthMetrics = function () {
    return this.get('/growth/brief');
  };
  api.getGrowthRecommendations = function () {
    return this.get('/growth/history');
  };
  // Hybrid Payments
  api.getHybridPaymentMethods = function () {
    return this.get('/business/payment-methods');
  };
  // Market Ideas
  api.getMarketIdeas = function (params?: any) {
    return this.get('/market/ideas', { params });
  };
  api.createMarketIdea = function (data: any) {
    return this.post('/market/ideas', data);
  };
  // Market Needs
  api.getMarketNeeds = function (params?: any) {
    return this.get('/market/needs', { params });
  };
  // Marketing
  api.getMarketingCampaigns = function (params?: any) {
    return this.get('/business/marketing', { params });
  };
  api.createMarketingCampaign = function (data: any) {
    return this.post('/business/marketing', data);
  };
  // Matching
  api.getMatchingSuggestions = function () {
    return this.get('/matching');
  };
  // Media Commerce
  api.getMediaCommerceItems = function (params?: any) {
    return this.get('/media-commerce', { params });
  };
  // Opportunities
  api.getOpportunities = function (params?: any) {
    return this.get('/opportunities', { params });
  };
  // Posts
  api.getPosts = function (params?: any) {
    return this.get('/posts', { params });
  };
  api.createPost = function (data: any) {
    return this.post('/posts', data);
  };
  api.deletePost = function (id: string) {
    return this.delete(`/posts/${id}`);
  };
  // Reactions
  api.getReactions = function (targetType: string, targetId: string) {
    return this.get(`/reactions/${targetType}/${targetId}`);
  };
  // Recommendations
  api.getRecommendations = function () {
    return this.get('/recommendations');
  };
  // Saved Items
  api.getSavedItems = function (params?: any) {
    return this.get('/saves', { params });
  };
  api.saveItem = function (data: { targetType: string; targetId: string }) {
    return this.post('/saves', data);
  };
  api.unsaveItem = function (id: string) {
    return this.delete(`/saves/${id}`);
  };
  // Signatures
  api.getSignatures = function (params?: any) {
    return this.get('/documents/signatures', { params });
  };
  api.createSignature = function (data: any) {
    return this.post('/documents/signatures', data);
  };
  // Smart Search
  api.getSmartSearchHistory = function () {
    return this.get('/search/history');
  };
  // Social Accounts
  api.getSocialAccounts = function () {
    return this.get('/social');
  };
  api.connectSocialAccount = function (data: any) {
    return this.post('/social/connect', data);
  };
  api.disconnectSocialAccount = function (id: string) {
    return this.delete(`/social/${id}`);
  };
  // Wallet
  api.getWallet = function () {
    return this.get('/wallet');
  };
  api.getWalletTransactions = function (params?: any) {
    return this.get('/wallet/transactions', { params });
  };
}
