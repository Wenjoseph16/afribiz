import { test as base, expect, Page, request } from '@playwright/test';
import type { APIRequestContext, BrowserContext } from '@playwright/test';

export const TEST_ACCOUNTS = {
  business: {
    email: 'demo@afribiz.com',
    password: 'Test1234!',
    name: 'Demo Business',
    role: 'BUSINESS',
  },
  client: {
    email: 'client@afribiz.com',
    password: 'Test1234!',
    name: 'Client Test',
    role: 'CLIENT',
  },
} as const;

export async function createTestAccount(
  apiContext: APIRequestContext,
  overrides?: { email?: string; role?: string }
): Promise<{
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  id: string;
}> {
  const timestamp = Date.now();
  const email = overrides?.email || `e2e-${timestamp}@test.afribiz.com`;
  const password = 'Test@123456!';

  const res = await apiContext.post('http://localhost:3001/api/auth/signup', {
    data: {
      firstName: 'E2E',
      lastName: `Test-${timestamp}`,
      email,
      password,
      confirmPassword: password,
      termsAccepted: true,
    },
  });
  const body = await res.json();

  if (!body.success) {
    const loginRes = await apiContext.post('http://localhost:3001/api/auth/login', {
      data: { identifier: email, password },
    });
    const loginBody = await loginRes.json();
    if (loginBody.success && loginBody.data) {
      return {
        email,
        password,
        accessToken: loginBody.data.accessToken,
        refreshToken: loginBody.data.refreshToken,
        id: loginBody.data.user?.id || '',
      };
    }
    throw new Error('Cannot create/login test account');
  }

  return {
    email,
    password,
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    id: body.data.user?.id || '',
  };
}

export async function authenticateViaApi(
  context: BrowserContext,
  credentials: { email: string; password: string }
): Promise<void> {
  const apiContext = await request.newContext();
  const res = await apiContext.post('http://localhost:3001/api/auth/login', {
    data: {
      identifier: credentials.email,
      password: credentials.password,
    },
  });
  const body = await res.json();

  if (!body.success || !body.data) {
    throw new Error('Login failed');
  }

  await context.addCookies([
    {
      name: 'accessToken',
      value: body.data.accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax' as const,
    },
  ]);

  await context.addInitScript((tokens) => {
    try {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user,
        },
        version: 0,
      }));
    } catch (e) {}
  }, body.data);

  await apiContext.dispose();
}

export async function waitForPageReady(page: Page, url?: string) {
  if (url) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}
