import type { ApiClientMethods } from './api-client.types';

export function injectReferral(api: ApiClientMethods) {
  api.getMyReferralCode = function () {
    return this.get('/referral/code');
  };
  api.inviteReferral = function (email: string) {
    return this.post('/referral/invite', { email });
  };
  api.getMyReferrals = function () {
    return this.get('/referral/list');
  };
  api.getMyReferralRewards = function () {
    return this.get('/referral/rewards');
  };
  api.getReferralStats = function () {
    return this.get('/referral/stats');
  };
}
