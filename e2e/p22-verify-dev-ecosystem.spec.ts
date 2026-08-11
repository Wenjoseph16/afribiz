import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(900_000);

const DEV_ACCOUNT = { email: 'dev1@afribiz.com', password: 'Afribiz@2026!' };
const INSTALLATION_ID = 'dmi-2'; // Stock Pro installe chez Saveur d'Abidjan (seed)

test('P22: workspace dev - sidebar clic par clic sans 404', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, DEV_ACCOUNT);
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) { s.state.selectedSpace = 'DEVELOPER'; localStorage.setItem('auth-storage', JSON.stringify(s)); }
      }
    } catch {}
  });

  const pages = [
    { url: '/dashboard/developer', h1: 'Dashboard', loose: true },
    { url: '/dashboard/developer/modules', h1: 'Modules', loose: true },
    { url: '/dashboard/developer/modules/publish', h1: '', loose: true },
    { url: '/dashboard/developer/marketplace', h1: 'Marketplace', loose: true },
    { url: '/dashboard/developer/demands', h1: 'Demandes', loose: true },
    
    { url: '/dashboard/developer/support', h1: 'Support', loose: true },
    { url: '/dashboard/developer/analytics', h1: 'Analytics', loose: true },
    { url: '/dashboard/developer/revenues', h1: 'Revenus', loose: true },
    { url: '/dashboard/developer/installations', h1: 'Installations', loose: true },
    { url: '/dashboard/developer/settings', h1: 'Paramètres', loose: true },
    { url: '/dashboard/developer/profile', h1: 'Profil', loose: true },
  ];

  for (const p of pages) {
    const res = await page.goto(p.url, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), `${p.url} ne doit pas être 404`).not.toBe(404);
    await page.waitForTimeout(2500);
    expect(errors.length, `erreurs React sur ${p.url}: ${errors.join(' | ')}`).toBe(0);
    console.log(`P22-DEV | ${p.url} -> HTTP ${res?.status()}`);
  }

  // Detail module + permissions + validation (relookes)
  await page.goto('/dashboard/developer/modules/devmod-1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const modTitle = await page.locator('h1').first().textContent();
  console.log('P22-DEV | module detail h1:', modTitle);
  expect(errors).toHaveLength(0);

  await page.goto('/dashboard/developer/modules/devmod-1/permissions', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const permH1 = page.getByRole('heading', { level: 1, name: 'Permissions du module' });
  await permH1.waitFor({ timeout: 60_000 });
  const permText = await permH1.textContent();
  console.log('P22-DEV | permissions h1:', permText);
  expect(permText).toContain('Permissions');
  expect(errors).toHaveLength(0);

  await page.goto('/dashboard/developer/modules/devmod-1/validation', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const valH1 = page.getByRole('heading', { level: 1, name: 'Validation du module' });
  await valH1.waitFor({ timeout: 60_000 });
  const valText = await valH1.textContent();
  console.log('P22-DEV | validation h1:', valText);
  expect(valText).toContain('Validation');
  expect(errors).toHaveLength(0);

  console.log('P22-DEV | workspace dev : tous les liens OK');
});

test('P22: business - page runtime module installe + section sidebar', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, {
    email: TEST_ACCOUNTS.business.email,
    password: TEST_ACCOUNTS.business.password,
  });
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) { s.state.selectedSpace = 'BUSINESS'; localStorage.setItem('auth-storage', JSON.stringify(s)); }
      }
    } catch {}
  });

  await page.goto('/dashboard/business/modules', { waitUntil: 'domcontentloaded' });
  const stockPro = page.locator('text=Stock Pro').first();
  await stockPro.waitFor({ timeout: 120_000 });
  const hasStockPro = await page.locator('text=Stock Pro').count();
  console.log('P22-BIZ | Mes modules contient Stock Pro:', hasStockPro);
  expect(hasStockPro).toBeGreaterThan(0);
  expect(errors).toHaveLength(0);

  await page.goto(`/dashboard/business/modules/${INSTALLATION_ID}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const h1 = await page.locator('h1').first().textContent();
  console.log('P22-BIZ | runtime h1:', h1);
  expect(h1).toContain('Stock Pro');

  const iframe = page.locator('iframe[sandbox]');
  await iframe.first().waitFor({ timeout: 60_000 });
  const sandbox = await iframe.first().getAttribute('sandbox');
  console.log('P22-BIZ | iframe sandbox attrs:', sandbox);
  expect(sandbox).toContain('allow-scripts');

  const uninstallBtn = await page.locator('text=Désinstaller').count();
  console.log('P22-BIZ | bouton Désinstaller:', uninstallBtn);
  expect(uninstallBtn).toBeGreaterThan(0);
  expect(errors).toHaveLength(0);

  // Section sidebar Modules installes + lien runtime
  await page.goto('/dashboard/business', { waitUntil: 'domcontentloaded' });
  const sidebarSection = page.locator('text=MODULES INSTALLÉS').first();
  await sidebarSection.waitFor({ timeout: 60_000 });
  console.log('P22-BIZ | section sidebar Modules installés: OK');

  const runtimeLink = page.locator(`a[href="/dashboard/business/modules/${INSTALLATION_ID}"]`).first();
  await runtimeLink.waitFor({ timeout: 30_000 });
  await runtimeLink.click();
  await page.waitForTimeout(4000);
  const url = page.url();
  console.log('P22-BIZ | après clic sidebar ->', url);
  expect(url).toContain(`/dashboard/business/modules/${INSTALLATION_ID}`);

  console.log('P22-BIZ | page runtime + sidebar : OK');
});
