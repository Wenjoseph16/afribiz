import { mockPrisma } from '../setup';
import {
  activateDeveloperRole,
  getMyDeveloperProfile,
  updateDeveloperProfile,
  submitVerification,
  getDeveloperDashboard,
  getPublicDeveloperProfile,
} from '../../controllers/developer';

jest.mock('../../services/developer', () => ({
  activateDeveloperRole: jest.fn(),
  getDeveloperProfile: jest.fn(),
  updateProfile: jest.fn(),
  submitVerification: jest.fn(),
  getDeveloperDashboard: jest.fn(),
  getPublicDeveloperProfile: jest.fn(),
}));

jest.mock('../../config/env', () => ({ config: { NODE_ENV: 'test' } }));

import * as developerService from '../../services/developer';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.cookie = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('developer controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activateDeveloperRole', () => {
    it('should activate developer role and set refreshToken cookie', async () => {
      const mockResult = {
        refreshToken: 'rt1',
        accessToken: 'at1',
        user: { id: 'u1' },
        profile: { id: 'p1' },
      };
      (developerService.activateDeveloperRole as jest.Mock).mockResolvedValue(mockResult);
      const res = mockRes();
      const next = jest.fn();
      activateDeveloperRole(req(), res, next);
      await flush();
      expect(developerService.activateDeveloperRole).toHaveBeenCalledWith('u1');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'rt1',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      activateDeveloperRole({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMyDeveloperProfile', () => {
    it('should return developer profile', async () => {
      (developerService.getDeveloperProfile as jest.Mock).mockResolvedValue({
        id: 'p1',
        companyName: 'DevCorp',
      });
      const res = mockRes();
      const next = jest.fn();
      getMyDeveloperProfile(req(), res, next);
      await flush();
      expect(developerService.getDeveloperProfile).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      getMyDeveloperProfile({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('updateDeveloperProfile', () => {
    it('should update developer profile', async () => {
      (developerService.updateProfile as jest.Mock).mockResolvedValue({
        id: 'p1',
        companyName: 'Updated',
      });
      const res = mockRes();
      const next = jest.fn();
      updateDeveloperProfile(req({ body: { companyName: 'Updated' } }), res, next);
      await flush();
      expect(developerService.updateProfile).toHaveBeenCalledWith('u1', { companyName: 'Updated' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      updateDeveloperProfile({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('submitVerification', () => {
    it('should submit verification documents', async () => {
      const docs = { identityDoc: 'id.jpg', companyDoc: 'co.jpg', responsiblePhoto: 'rp.jpg' };
      (developerService.submitVerification as jest.Mock).mockResolvedValue({
        id: 'p1',
        verificationStatus: 'PENDING',
      });
      const res = mockRes();
      const next = jest.fn();
      submitVerification(req({ body: docs }), res, next);
      await flush();
      expect(developerService.submitVerification).toHaveBeenCalledWith('u1', docs);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      submitVerification({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getDeveloperDashboard', () => {
    it('should return developer dashboard', async () => {
      (developerService.getDeveloperDashboard as jest.Mock).mockResolvedValue({
        overview: { totalModules: 5 },
      });
      const res = mockRes();
      const next = jest.fn();
      getDeveloperDashboard(req(), res, next);
      await flush();
      expect(developerService.getDeveloperDashboard).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      getDeveloperDashboard({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getPublicDeveloperProfile', () => {
    it('should return public developer profile by id', async () => {
      (developerService.getPublicDeveloperProfile as jest.Mock).mockResolvedValue({
        id: 'p1',
        companyName: 'DevCorp',
        modules: [],
      });
      const res = mockRes();
      const next = jest.fn();
      getPublicDeveloperProfile({ params: { id: 'dev-id-1' } } as any, res, next);
      await flush();
      expect(developerService.getPublicDeveloperProfile).toHaveBeenCalledWith('dev-id-1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
