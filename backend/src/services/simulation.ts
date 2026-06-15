import { prisma } from '../lib/db';

export async function getSimulationEnvironments(developerId: string) {
  const profile = await prisma.developerProfile.findUnique({ where: { userId: developerId } });
  if (!profile) return [];

  const modules = await prisma.developerModule.findMany({
    where: { developerId: profile.id },
    select: { id: true, name: true, slug: true, version: true, category: true },
  });

  return modules.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    version: m.version,
    category: m.category,
    status: 'ready',
    apiUrl: `/api/sandbox/${m.slug}`,
    lastTested: null,
  }));
}

export async function testEndpoint(developerId: string, moduleSlug: string, endpoint: string, method: string, body?: any) {
  const profile = await prisma.developerProfile.findUnique({ where: { userId: developerId } });
  if (!profile) throw new Error('Developer profile not found');

  const module = await prisma.developerModule.findFirst({
    where: { slug: moduleSlug, developerId: profile.id },
  });
  if (!module) throw new Error('Module not found');

  const mockResponses: Record<string, any> = {
    '/install': { success: true, data: { id: 'sim_' + Date.now(), status: 'installed', module: module.name, version: module.version, installedAt: new Date().toISOString() } },
    '/uninstall': { success: true, data: { id: 'sim_' + Date.now(), status: 'uninstalled', module: module.name } },
    '/configure': { success: true, data: { id: 'sim_' + Date.now(), status: 'configured', settings: body || {} } },
    '/health': { success: true, data: { status: 'healthy', module: module.name, version: module.version, uptime: '99.9%' } },
    '/data': { success: true, data: { items: [], total: 0, page: 1, limit: 20, simulated: true } },
    '/webhook': { success: true, data: { received: true, timestamp: new Date().toISOString(), payload: body || {} } },
  };

  const response = mockResponses[endpoint] || {
    success: true,
    data: { message: 'Endpoint simulé', endpoint, method, module: module.name, simulated: true, timestamp: new Date().toISOString() },
  };

  const latency = Math.floor(Math.random() * 200) + 50;

  return {
    statusCode: 200,
    latency,
    response,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
  };
}

export async function getSimulationLogs(developerId: string, moduleSlug?: string) {
  const profile = await prisma.developerProfile.findUnique({ where: { userId: developerId } });
  if (!profile) return [];

  const where: any = { developerId: profile.id };
  if (moduleSlug) {
    const module = await prisma.developerModule.findFirst({ where: { slug: moduleSlug, developerId: profile.id } });
    if (module) where.moduleId = module.id;
  }

  return [];
}

export async function getMockData(developerId: string, moduleSlug: string, dataType: string) {
  const profile = await prisma.developerProfile.findUnique({ where: { userId: developerId } });
  if (!profile) throw new Error('Developer profile not found');

  const mockDataSets: Record<string, any[]> = {
    businesses: Array.from({ length: 5 }, (_, i) => ({
      id: `biz_${i + 1}`,
      name: `Entreprise ${i + 1}`,
      slug: `entreprise-${i + 1}`,
      type: ['RESTAURANT', 'BOUTIQUE', 'SERVICE', 'ECOLE', 'HOTEL'][i],
      city: ['Lomé', 'Abidjan', 'Ouagadougou', 'Cotonou', 'Dakar'][i],
      isActive: true,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    })),
    users: Array.from({ length: 10 }, (_, i) => ({
      id: `user_${i + 1}`,
      firstName: ['Alice', 'Bob', 'Charles', 'Diana', 'Eve', 'Frank', 'Grace', 'Hugo', 'Iris', 'Jean'][i],
      lastName: 'Simulé',
      email: `user${i + 1}@test.afribiz.com`,
      role: i < 3 ? 'BUSINESS' : 'CLIENT',
      city: ['Lomé', 'Abidjan', 'Dakar'][i % 3],
    })),
    orders: Array.from({ length: 8 }, (_, i) => ({
      id: `order_${i + 1}`,
      orderNumber: `SIM-${String(i + 1).padStart(4, '0')}`,
      status: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'][i % 4],
      totalAmount: (Math.random() * 50000 + 5000).toFixed(0),
      currency: 'FCFA',
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    })),
    payments: Array.from({ length: 6 }, (_, i) => ({
      id: `pay_${i + 1}`,
      amount: (Math.random() * 100000 + 10000).toFixed(0),
      method: ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'][i % 3],
      status: ['COMPLETED', 'PENDING', 'FAILED'][i % 3],
      reference: `SIM-REF-${i + 1}`,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    })),
  };

  return mockDataSets[dataType] || [];
}

export async function getAvailableEndpoints() {
  return [
    { path: '/install', method: 'POST', description: 'Installer le module sur une entreprise', params: { businessId: 'string (required)' } },
    { path: '/uninstall', method: 'POST', description: 'Désinstaller le module', params: { businessId: 'string (required)' } },
    { path: '/configure', method: 'PUT', description: 'Configurer les paramètres du module', params: { settings: 'object (required)' } },
    { path: '/health', method: 'GET', description: 'Vérifier l\'état du module' },
    { path: '/data', method: 'GET', description: 'Récupérer les données du module', params: { page: 'number', limit: 'number' } },
    { path: '/webhook', method: 'POST', description: 'Tester un webhook', params: { event: 'string (required)', payload: 'object' } },
  ];
}
