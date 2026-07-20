import type { ApiClientMethods } from './api-client.types';

export function injectGamification(api: ApiClientMethods) {
  api.getGamificationDashboard = function () {
    return this.get('/gamification/dashboard');
  };
  api.getMyQuests = function () {
    return this.get('/gamification/quests');
  };
  api.getCompletedQuests = function () {
    return this.get('/gamification/quests/completed');
  };
  api.getMyStreaks = function () {
    return this.get('/gamification/streaks');
  };
  api.getMyRanking = function () {
    return this.get('/gamification/ranking');
  };
  api.getLeaderboard = function (params?: any) {
    return this.get('/gamification/leaderboard', { params });
  };
  api.getMyChallenges = function () {
    return this.get('/gamification/challenges');
  };
  api.initializeQuests = function () {
    return this.post('/gamification/quests/initialize');
  };
}
