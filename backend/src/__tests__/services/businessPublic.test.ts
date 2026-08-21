jest.mock('../../lib/db', () => ({ prisma: { business: { findFirst: jest.fn() } } }));
jest.mock('../../services/analyticsService', () => ({
  trackAnalyticsEvent: jest.fn().mockReturnValue({ catch: () => {} }),
}));
jest.mock('../../services/portfolio', () => ({ getPublicPortfolio: jest.fn() }));
jest.mock('../../lib/businessModules', () => ({
  resolveBusinessModules: jest.fn().mockReturnValue(['PRODUCTS', 'PORTFOLIO']),
}));
jest.mock('../../events/publishers', () => ({
  publishOnboardingCompleted: jest.fn(),
  publishBusinessRegistered: jest.fn(),
}));
jest.mock('../../services/afriScoreService', () => ({ recalculateScore: jest.fn() }));
jest.mock('../../services/planAccessService', () => ({ DEFAULT_PLAN_ID: 'plan-afribiz' }));

import { getPublicBusiness } from '../../services/business';
import { prisma } from '../../lib/db';

const mockBiz = {
  id: 'biz-1',
  slug: 'joshbiz',
  name: 'JoshBiz',
  type: 'FREELANCE',
  shortDescription: 'Dev web',
  logo: 'http://localhost:3001/uploads/logo.webp',
  coverImage: 'http://localhost:3001/uploads/banner.webp',
  skills: ['Web', 'Design'],
  certifications: ['CFA — LMBI'],
  certificationImages: ['http://localhost:3001/uploads/cert.webp'],
  experience: 3,
  managerBio: 'Passionné par le web',
  modules: ['PRODUCTS', 'PORTFOLIO'],
  hours: [{ day: 1, open: '08:00', close: '18:00', isClosed: false }],
  paymentMethods: [{ id: 'pm-1', method: 'MOBILE_MONEY', name: 'MTN' }],
  deliveryZones: [{ id: 'dz-1', name: 'Centre', fee: 500 }],
  moduleAssignments: [{ module: 'PRODUCTS' }, { module: 'PORTFOLIO' }],
  owner: { id: 'owner-1', firstName: 'Josh', lastName: 'Wen', avatar: null },
  address: 'Agoe',
  city: 'Lome',
  country: 'Togo',
  phone: '+22892528688',
  latitude: 6.1,
  longitude: 1.2,
  isActive: true,
  deletedAt: null,
};

describe('getPublicBusiness (page publique)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Step 1: returns identity (name, type, logo, banner, description)', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(mockBiz);
    const r = await getPublicBusiness('joshbiz');
    expect(r.name).toBe('JoshBiz');
    expect(r.logo).toContain('http');
    expect(r.coverImage).toContain('http');
    expect(r.shortDescription).toBe('Dev web');
  });

  test('Step 2: returns skills, certifications, certificationImages, experience', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(mockBiz);
    const r = await getPublicBusiness('joshbiz');
    expect(r.skills).toEqual(['Web', 'Design']);
    expect(r.certifications).toEqual(['CFA — LMBI']);
    expect(r.certificationImages).toEqual(['http://localhost:3001/uploads/cert.webp']);
    expect(r.experience).toBe(3);
  });

  test('Step 4: returns hours, location, phone', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(mockBiz);
    const r = await getPublicBusiness('joshbiz');
    expect(r.hours.length).toBeGreaterThan(0);
    expect(r.city).toBe('Lome');
    expect(r.phone).toBe('+22892528688');
  });

  test('Step 4: returns payment methods + delivery zones (sidebar)', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(mockBiz);
    const r = await getPublicBusiness('joshbiz');
    expect(r.paymentMethods.length).toBe(1);
    expect(r.deliveryZones.length).toBe(1);
  });

  test('Step 5: merges modules from moduleAssignments', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(mockBiz);
    const r = await getPublicBusiness('joshbiz');
    expect(r.modules).toContain('PRODUCTS');
    expect(r.modules).toContain('PORTFOLIO');
  });

  test('throws 404 when not found', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(getPublicBusiness('nonexistent')).rejects.toThrow('Business non trouvé');
  });
});
