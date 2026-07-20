const DEFAULT_METHODS = [
  'create',
  'createMany',
  'findFirst',
  'findUnique',
  'findMany',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
  'upsert',
] as const;

/**
 * Proxy-based lazy mock for Prisma.
 * Only creates jest.fn() when a model method is actually accessed.
 * This avoids heap overflow from eagerly creating ~2000 mock functions.
 */
function createMockPrisma(): Record<string, any> {
  const modelCache = new Map<string, Record<string, jest.Mock>>();
  // Cache for special $ methods that need to be mockable via jest.spyOn
  const specialMethodCache = new Map<string, jest.Mock>();

  function getSpecialMethod(name: string, defaultImpl?: (...args: any[]) => any): jest.Mock {
    if (specialMethodCache.has(name)) return specialMethodCache.get(name)!;
    const mock = jest.fn(defaultImpl);
    specialMethodCache.set(name, mock);
    return mock;
  }

  const prismaHandler: ProxyHandler<Record<string, any>> = {
    get(target, prop) {
      // Check target first (for properties set by jest.spyOn directly)
      if (prop in target) return Reflect.get(target, prop);

      if (typeof prop === 'string' && prop.startsWith('$')) {
        if (specialMethodCache.has(prop)) return specialMethodCache.get(prop)!;
        if (prop === '$transaction') {
          return getSpecialMethod('$transaction', (fn: (mock: any) => Promise<any>) => fn(mock));
        }
        if (
          prop === '$connect' ||
          prop === '$disconnect' ||
          prop === '$queryRawUnsafe' ||
          prop === '$queryRaw'
        ) {
          return getSpecialMethod(prop as string);
        }
        return Reflect.get(target, prop);
      }
      if (typeof prop === 'string' && !prop.startsWith('_')) {
        if (!modelCache.has(prop)) {
          const methods: Record<string, jest.Mock> = {};
          for (const m of DEFAULT_METHODS) {
            methods[m] = jest.fn();
          }
          modelCache.set(prop, methods);
        }
        return modelCache.get(prop);
      }
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      const key = String(prop);
      // Allow jest.spyOn to override special methods and model methods
      if (key.startsWith('$')) {
        specialMethodCache.set(key, value);
        return true;
      }
      if (modelCache.has(key)) {
        const methods = modelCache.get(key)!;
        // If setting a method on a model, update the cached methods
        if (
          typeof value === 'function' ||
          (value && value.constructor && value.constructor.name === 'Function')
        ) {
          Object.assign(methods, value);
        }
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  };

  const mock = new Proxy({}, prismaHandler);
  return mock;
}

const mockPrisma = createMockPrisma();

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/mail', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    welcome: jest.fn().mockReturnValue({ subject: 'Welcome', html: '<html></html>' }),
    passwordReset: jest.fn().mockReturnValue({ subject: 'Reset', html: '<html></html>' }),
    otp: jest.fn().mockReturnValue({ subject: 'OTP', html: '<html></html>' }),
  },
}));

jest.mock('@/services/twoFactorService', () => ({
  generateSecret: jest.fn().mockResolvedValue({ secret: 'mock-secret', uri: 'otpauth://...' }),
  verifyToken: jest.fn().mockResolvedValue(true),
  generateQrCode: jest.fn().mockResolvedValue('data:image/png;base64,...'),
}));

export { mockPrisma };
