const mockCreate = jest.fn().mockResolvedValue({ id: 'biz-new', slug: 'mon-business', name: 'Mon', type: 'RESTAURANT', modules: [] });
const mockFind = jest.fn().mockResolvedValue(null);
const txProxy = new Proxy({} as any, {
  get(_t, prop) {
    if (prop === Symbol.toPrimitive || prop === 'then') return undefined;
    return { create: jest.fn().mockResolvedValue({ id: `${String(prop)}-1` }), createMany: jest.fn(), update: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue(null) };
  }
});
jest.mock('../../lib/db', () => ({ prisma: {
  business: { findFirst: mockFind, findUnique: mockFind, create: mockCreate, update: jest.fn() },
  businessHour: { createMany: jest.fn() }, portfolioItem: { createMany: jest.fn() },
  subscriptionPlan: { findUnique: jest.fn().mockResolvedValue({ id: 'plan-afribiz' }) },
  user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', roles: ['CLIENT'] }), update: jest.fn() },
  $transaction: jest.fn(async (fn: any) => fn(txProxy)),
}}));
jest.mock('../../services/analyticsService', () => ({ trackAnalyticsEvent: jest.fn().mockReturnValue({ catch: () => {} }) }));
jest.mock('../../services/portfolio', () => ({ getPublicPortfolio: jest.fn() }));
jest.mock('../../lib/businessModules', () => ({ resolveBusinessModules: jest.fn().mockReturnValue(['PRODUCTS']) }));
jest.mock('../../events/publishers', () => ({ publishOnboardingCompleted: jest.fn(), publishBusinessRegistered: jest.fn(), publishBusinessKycSubmitted: jest.fn(), publishReviewResponse: jest.fn(), publishReviewPublished: jest.fn() }));
jest.mock('../../services/afriScoreService', () => ({ recalculateScore: jest.fn() }));
jest.mock('../../services/planAccessService', () => ({ DEFAULT_PLAN_ID: 'plan-afribiz' }));

import { prisma } from '../../lib/db';
const B = { name: 'Mon', type: 'RESTAURANT' as const, shortDescription: 'T', phone: '+2289', address: 'A', city: 'L', country: 'TG', latitude: 1, longitude: 1, logo: 'l', coverImage: 'c', modules: ['PRODUCTS'] as any[] };

describe('Onboarding createBusiness', () => {
  beforeEach(() => jest.clearAllMocks());
  test('Step 1: creates business via $transaction', async () => {
    const { createBusiness } = require('../../services/business');
    await createBusiness('u1', B);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
  test('Step 2: skills+certifications', async () => {
    const { createBusiness } = require('../../services/business');
    await createBusiness('u1', { ...B, skills: ['Web'], certifications: ['CFA'], certificationImages: ['c.webp'], experience: 3 });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
  test('Step 3: portfolio', async () => {
    const { createBusiness } = require('../../services/business');
    await createBusiness('u1', { ...B, portfolio: [{ title: 'P1' }] });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
  test('Step 4: openingHours', async () => {
    const { createBusiness } = require('../../services/business');
    await createBusiness('u1', { ...B, openingHours: { lundi: { open: '08:00', close: '18:00', closed: false } } });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
