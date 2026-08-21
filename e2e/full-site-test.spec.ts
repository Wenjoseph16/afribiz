import { test, expect, Page, request } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import fs from 'fs';
import {
  BUSINESS_ROUTES,
  DEV_ROUTES,
  ADMIN_ROUTES,
  CLIENT_ROUTES,
} from './routes-data';

// ============================================================
// TEST COMPLET DU SITE (v2) : routes RÉELLES du sidebar
// Comptes 100% neufs. Chaque page : statut HTTP + erreurs
// console + erreurs runtime + requêtes échouées.
// ============================================================

const ACCOUNTS = (() => {
  try {
    return JSON.parse(fs.readFileSync('C:/tmp/afribiz-e2e-accounts.json', 'utf-8'));
  } catch {
    return null;
  }
})();

const MAIN = ACCOUNTS?.main || { email: '', password: 'Afribiz@2026!' };
const ADMIN = ACCOUNTS?.admin || { email: '', password: 'Afribiz@2026!' };

test.setTimeout(9_000_000); // 2h30 — dev server très lent à froid

interface PageResult {
  url: string;
  status: number;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
}

async function auth(context: BrowserContext, credentials: { email: string; password: string }) {
  const apiContext = await request.newContext();
  const res = await apiContext.post('http://localhost:3001/api/auth/login', {
    data: { identifier: credentials.email, password: credentials.password },
  });
  const body = await res.json();
  if (!body.success || !body.data) throw new Error(`Login failed: ${credentials.email}`);
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
      window.localStorage.setItem('accessToken', tokens.accessToken);
      window.localStorage.setItem('refreshToken', tokens.refreshToken);
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user },
        version: 0,
      }));
    } catch (e) { /* ignore */ }
  }, body.data);
  await apiContext.dispose();
}

async function visitPage(
  page: Page,
  url: string,
  results: PageResult[],
  ignorePatterns: RegExp[]
): Promise<void> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  const onConsole = (msg: any) => {
    if (msg.type() === 'error') consoleErrors.push(String(msg.text()).slice(0, 160));
  };
  const onPageError = (e: any) => pageErrors.push(String(e.message).slice(0, 160));
  const onFailed = (req: any) => failedRequests.push(`${req.resourceType()} ${req.url().slice(0, 140)}`);

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onFailed);

  let status = 0;
  try {
    const resp = await page.goto(`http://localhost:3000${url}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    status = resp?.status() || 0;
    await page.waitForTimeout(1500);
  } catch (e) {
    status = -1;
    pageErrors.push(String((e as Error).message).slice(0, 160));
  }

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('requestfailed', onFailed);

  const realErrors = consoleErrors.filter((e) => !ignorePatterns.some((re) => re.test(e)));
  const realFailed = failedRequests.filter((u) => !ignorePatterns.some((re) => re.test(u)));
  results.push({ url, status, consoleErrors: realErrors, pageErrors, failedRequests: realFailed });
}

const IGNORE = [
  /favicon/,
  /sourceMappingURL/,
  /__nextjs/,
  /webpack-hot/,
  /Failed to load resource/,
  /Content Security Policy/,
  /commondatastorage.googleapis.com/,
];

function summarize(results: PageResult[], label: string) {
  const bad = results.filter((r) => r.status >= 400 || r.status === -1 || r.pageErrors.length > 0 || r.consoleErrors.length > 0);
  console.log(`\n========== ${label} : ${results.length} pages ==========`);
  console.log(`OK: ${results.length - bad.length} | PROBLEMES: ${bad.length}`);
  for (const r of bad) {
    console.log(`--- ${r.url} [status=${r.status}]`);
    for (const e of r.pageErrors.slice(0, 2)) console.log(`   PAGEERROR: ${e}`);
    for (const e of r.consoleErrors.slice(0, 3)) console.log(`   CONSOLE: ${e}`);
    for (const f of r.failedRequests.slice(0, 3)) console.log(`   FAILED: ${f}`);
  }
  return bad;
}

test('FULL-SITE: client', async ({ browser }) => {
  test.slow();
  const context = await browser.newContext();
  if (!MAIN.email) throw new Error('Comptes e2e absents — lancer le setup');
  await auth(context, { email: MAIN.email, password: MAIN.password });
  const page = await context.newPage();
  const results: PageResult[] = [];
  for (const url of CLIENT_ROUTES) await visitPage(page, url, results, IGNORE);
  const bad = summarize(results, 'CLIENT');
  await context.close();
  expect(bad.filter((r) => r.status === 404 || r.status === -1 || r.pageErrors.length > 0)).toHaveLength(0);
});

test('FULL-SITE: business', async ({ browser }) => {
  test.slow();
  const context = await browser.newContext();
  await auth(context, { email: MAIN.email, password: MAIN.password });
  const page = await context.newPage();
  const results: PageResult[] = [];
  for (const url of BUSINESS_ROUTES) await visitPage(page, url, results, IGNORE);
  const bad = summarize(results, 'BUSINESS');
  await context.close();
  expect(bad.filter((r) => r.status === 404 || r.status === -1 || r.pageErrors.length > 0)).toHaveLength(0);
});

test('FULL-SITE: developpeur', async ({ browser }) => {
  test.slow();
  const context = await browser.newContext();
  await auth(context, { email: MAIN.email, password: MAIN.password });
  const page = await context.newPage();
  const results: PageResult[] = [];
  for (const url of DEV_ROUTES) await visitPage(page, url, results, IGNORE);
  const bad = summarize(results, 'DEVELOPPEUR');
  await context.close();
  expect(bad.filter((r) => r.status === 404 || r.status === -1 || r.pageErrors.length > 0)).toHaveLength(0);
});

test('FULL-SITE: admin', async ({ browser }) => {
  test.slow();
  const context = await browser.newContext();
  await auth(context, { email: ADMIN.email, password: ADMIN.password });
  const page = await context.newPage();
  const results: PageResult[] = [];
  for (const url of ADMIN_ROUTES) await visitPage(page, url, results, IGNORE);
  const bad = summarize(results, 'ADMIN');
  await context.close();
  expect(bad.filter((r) => r.status === 404 || r.status === -1 || r.pageErrors.length > 0)).toHaveLength(0);
});
