jest.mock('../../services/training', () => ({
  listAllTrainings: jest.fn(),
  getUserTrainings: jest.fn(),
  enrollInTraining: jest.fn(),
}));

jest.mock('../../services/certificateGenerator', () => ({
  generateCertificate: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import * as ctrl from '../../controllers/training';
import * as ts from '../../services/training';
import * as cs from '../../services/certificateGenerator';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('training controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listAllTrainings', () => {
    it('should list all trainings', async () => {
      (ts.listAllTrainings as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      ctrl.listAllTrainings(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { trainings: [{ id: 't1' }] } });
    });
  });

  describe('getMyTrainings', () => {
    it('should return user trainings', async () => {
      (ts.getUserTrainings as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      ctrl.getMyTrainings(req(), res, jest.fn());
      await flush();
      expect(ts.getUserTrainings).toHaveBeenCalledWith('u1');
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyTrainings({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('enrollInTraining', () => {
    it('should enroll', async () => {
      (ts.enrollInTraining as jest.Mock).mockResolvedValue({ enrollment: { id: 'e1' } });
      const res = mockRes();
      ctrl.enrollInTraining(req({ params: { id: 't1' } }), res, jest.fn());
      await flush();
      expect(ts.enrollInTraining).toHaveBeenCalledWith('u1', 't1');
    });
  });

  describe('generateCertificateCtrl', () => {
    it('should generate certificate', async () => {
      (cs.generateCertificate as jest.Mock).mockResolvedValue({ url: 'cert.pdf' });
      const res = mockRes();
      ctrl.generateCertificateCtrl(req({ params: { trainingId: 't1' } }), res, jest.fn());
      await flush();
      expect(cs.generateCertificate).toHaveBeenCalledWith('u1', 't1');
    });
  });
});
