import { mockPrisma } from '../setup';
import * as contentReportCtrl from '../../controllers/contentReportController';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data, message = 'Success') => ({ success: true, data, message })),
}));

jest.mock('../../services/contentReportService', () => ({
  createReport: jest.fn(),
  getReports: jest.fn(),
  getReportById: jest.fn(),
  resolveReport: jest.fn(),
  countReportsByStatus: jest.fn(),
}));

const mockReportService = jest.requireMock('../../services/contentReportService');

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('contentReport controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a report and return 201', async () => {
      const report = { id: 'r1', type: 'PRODUCT', referenceId: 'p1', reason: 'Spam' };
      mockReportService.createReport.mockResolvedValue(report);
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.createReport(
        req({ body: { type: 'PRODUCT', referenceId: 'p1', reason: 'Spam' } }),
        res,
        next
      );
      await flush();
      expect(mockReportService.createReport).toHaveBeenCalledWith({
        reporterId: 'u1',
        type: 'PRODUCT',
        referenceId: 'p1',
        reason: 'Spam',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: report,
        message: 'Signalement envoyé',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.createReport({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if type, referenceId, or reason are missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.createReport(req({ body: { type: 'PRODUCT' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));

      const res2 = mockRes();
      const next2 = jest.fn();
      contentReportCtrl.createReport(
        req({ body: { referenceId: 'p1', reason: 'Spam' } }),
        res2,
        next2
      );
      await flush();
      expect(next2).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if type is invalid', async () => {
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.createReport(
        req({ body: { type: 'INVALID', referenceId: 'p1', reason: 'Spam' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      const result = {
        items: [{ id: 'r1' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockReportService.getReports.mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.getReports(
        req({ query: { status: 'PENDING', type: 'PRODUCT', page: '2', limit: '10' } }),
        res,
        next
      );
      await flush();
      expect(mockReportService.getReports).toHaveBeenCalledWith({
        status: 'PENDING',
        type: 'PRODUCT',
        page: 2,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: 'Success' });
    });
  });

  describe('getReportById', () => {
    it('should return a report by id', async () => {
      const report = { id: 'r1', type: 'PRODUCT', reason: 'Spam' };
      mockReportService.getReportById.mockResolvedValue(report);
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.getReportById(req({ params: { id: 'r1' } }), res, next);
      await flush();
      expect(mockReportService.getReportById).toHaveBeenCalledWith('r1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: report, message: 'Success' });
    });

    it('should return 404 if report not found', async () => {
      mockReportService.getReportById.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.getReportById(req({ params: { id: 'r1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('resolveReport', () => {
    it('should resolve a report successfully', async () => {
      const report = { id: 'r1', status: 'DISMISSED' };
      mockReportService.resolveReport.mockResolvedValue(report);
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.resolveReport(
        req({ params: { id: 'r1' }, body: { status: 'DISMISSED' } }),
        res,
        next
      );
      await flush();
      expect(mockReportService.resolveReport).toHaveBeenCalledWith('r1', 'u1', 'DISMISSED');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: report,
        message: 'Signalement mis à jour',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.resolveReport({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if status is invalid', async () => {
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.resolveReport(
        req({ params: { id: 'r1' }, body: { status: 'INVALID' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getReportCounts', () => {
    it('should return counts grouped by status', async () => {
      const counts = { pending: 5, reviewed: 2, dismissed: 1, actionTaken: 0 };
      mockReportService.countReportsByStatus.mockResolvedValue(counts);
      const res = mockRes();
      const next = jest.fn();
      contentReportCtrl.getReportCounts(req(), res, next);
      await flush();
      expect(mockReportService.countReportsByStatus).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: counts, message: 'Success' });
    });
  });
});
