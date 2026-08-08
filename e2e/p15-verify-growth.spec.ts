import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P15 - Verification visuelle pages Portfolio + Logements upgradees 2027
test('P15: portfolio + logements en langage 2027', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, { email: TEST_ACCOUNTS.business.email, password: TEST_ACCOUNTS.business.password });
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) { s.state.selectedSpace = 'BUSINESS'; localStorage.setItem('auth-storage', JSON.stringify(s)); }
      }
    } catch {}
  });

  // ── Page Portfolio : titre exact du PageHeader ──
  await page.goto('/dashboard/portfolio', { waitUntil: 'domcontentloaded' });
  const titleP = page.getByRole('heading', { level: 1, name: 'Centre des réalisations' });
  await titleP.waitFor({ timeout: 180_000 });
  console.log('P15-PORTFOLIO | titre exact: OK');

  await page.waitForTimeout(5000);
  const pLive = await page.locator('text=Temps réel').count();
  const pNew = await page.locator('text=Nouvel élément').count();
  const pTotal = await page.locator('text=Total projets').count();
  console.log('P15-PORTFOLIO | live:', pLive, '| newBtn:', pNew, '| kpi:', pTotal);

  console.log('P15-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});

// P15b - Page Logements avec le compte hotel (2 chambres reelles)
test('P15b: logements (compte hotel, donnees reelles)', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, { email: 'hotel@afribiz.com', password: 'Afribiz@2026!' });
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) { s.state.selectedSpace = 'BUSINESS'; localStorage.setItem('auth-storage', JSON.stringify(s)); }
      }
    } catch {}
  });

  await page.goto('/dashboard/rooms', { waitUntil: 'domcontentloaded' });
  const titleR = page.getByRole('heading', { level: 1, name: 'Centre des logements' });
  await titleR.waitFor({ timeout: 180_000 });
  console.log('P15-ROOMS | titre exact: OK');

  await page.waitForTimeout(6000);
  const rLive = await page.locator('text=Temps réel').count();
  const rNew = await page.locator('text=Nouvelle chambre').count();
  const rPlanning = await page.locator('text=Planning').count();
  const rStd = await page.locator('text=Chambre Standard').count();
  console.log('P15-ROOMS | live:', rLive, '| newBtn:', rNew, '| planning:', rPlanning, '| chambres:', rStd);

  console.log('P15B-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
