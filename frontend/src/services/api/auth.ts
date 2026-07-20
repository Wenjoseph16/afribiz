import type { ApiClientMethods } from './api-client.types';

export function injectAuth(api: ApiClientMethods) {
  api.signup = function (data: any) {
    return this.post('/auth/signup', data);
  };
  api.login = function (data: { identifier: string; password: string; rememberMe?: boolean }) {
    return this.post('/auth/login', data);
  };
  api.logout = function () {
    return this.post('/auth/logout');
  };
  api.forgotPassword = function (email: string) {
    return this.post('/auth/forgot-password', { email });
  };
  api.resetPassword = function (token: string, password: string) {
    return this.post('/auth/reset-password', { token, password });
  };
  api.verifyEmail = function (token: string) {
    return this.post('/auth/verify-email', { token });
  };
  api.resendVerification = function (email: string) {
    return this.post('/auth/resend-verification', { email });
  };
  api.sendOTP = function (email: string, type: string) {
    return this.post('/auth/send-otp', { email, type });
  };
  api.verifyOTP = function (email: string, code: string, type: string) {
    return this.post('/auth/verify-otp', { email, code, type });
  };
  api.getSessions = function () {
    return this.get('/auth/sessions');
  };
  api.revokeSession = function (sessionId: string) {
    return this.delete(`/auth/sessions/${sessionId}`);
  };
  api.activateBusinessRole = function () {
    return this.post('/auth/activate-business');
  };
  api.activateDeveloperRole = function () {
    return this.post('/auth/activate-developer');
  };
  api.revokeOtherSessions = function () {
    return this.post('/auth/sessions/revoke-others');
  };
  api.getActiveSessions = function () {
    return this.get('/auth/sessions/active');
  };
  api.get2FAStatus = function () {
    return this.get('/auth/2fa/status');
  };
  api.setup2FA = function () {
    return this.post('/auth/2fa/setup');
  };
  api.verify2FA = function (token: string) {
    return this.post('/auth/2fa/verify', { token });
  };
  api.disable2FA = function (password: string) {
    return this.post('/auth/2fa/disable', { password });
  };
  api.verify2FALogin = function (data: {
    identifier: string;
    password: string;
    tempToken: string;
    totpCode: string;
    rememberMe?: boolean;
  }) {
    return this.post('/auth/verify-2fa', data);
  };
}
