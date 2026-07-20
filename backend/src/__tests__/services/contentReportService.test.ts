import { mockPrisma } from '../setup';
import {
  createReport,
  getReports,
  resolveReport,
  getReportById,
  countReportsByStatus,
} from '../../services/contentReportService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockReport = {
  id: 'rpt-1',
  reporterId: 'u1',
  type: 'PRODUCT',
  referenceId: 'prod-1',
  reason: 'INAPPROPRIATE',
  status: 'PENDING',
  createdAt: new Date(),
};

describe('Content Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createReport creates report', async () => {
    jest.spyOn(mockPrisma.contentReport, 'create').mockResolvedValue(mockReport as any);
    const r = await createReport({
      reporterId: 'u1',
      type: 'PRODUCT',
      referenceId: 'prod-1',
      reason: 'INAPPROPRIATE',
    });
    expect(r.id).toBe('rpt-1');
  });

  test('getReports returns paginated', async () => {
    jest.spyOn(mockPrisma.contentReport, 'findMany').mockResolvedValue([mockReport as any]);
    jest.spyOn(mockPrisma.contentReport, 'count').mockResolvedValue(1);
    const r = await getReports({});
    expect(r.pagination.total).toBe(1);
  });

  test('resolveReport updates status', async () => {
    jest.spyOn(mockPrisma.contentReport, 'findFirst').mockResolvedValue(mockReport as any);
    jest
      .spyOn(mockPrisma.contentReport, 'update')
      .mockResolvedValue({ ...mockReport, status: 'ACTION_TAKEN' } as any);
    const r = await resolveReport('rpt-1', 'u1', 'ACTION_TAKEN' as any);
    expect(r.status).toBe('ACTION_TAKEN');
  });

  test('countReportsByStatus returns counts', async () => {
    jest
      .spyOn(mockPrisma.contentReport, 'groupBy')
      .mockResolvedValue([{ status: 'PENDING', _count: 5 }] as any);
    const r = await countReportsByStatus();
    expect(r).toBeDefined();
  });
});
