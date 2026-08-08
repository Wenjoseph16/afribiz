import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P11 - Verification visuelle pages Planning + Evenements + Locations upgradees 2027
test('P11: planning + evenements + locations en langage 2027', async ({ page, context }) => {
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

  // ── Page Planning : attendre le titre exact du PageHeader ──
  await page.goto('/dashboard/planning', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'Centre de pilotage des tâches' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P11-PLANNING | titre exact: OK');

  await page.waitForTimeout(6000);
  const plaLive = await page.locator('text=Temps réel').count();
  const plaNew = await page.locator('text=Nouvelle tâche').count();
  const plaTasks = await page.locator('text=tâche').count();
  console.log('P11-PLANNING | live:', plaLive, '| newBtn:', plaNew, '| tasks:', plaTasks);

  // ── Page Evenements ──
  await page.goto('/dashboard/events', { waitUntil: 'domcontentloaded' });
  const titleB = page.getByRole('heading', { level: 1, name: 'Centre des événements' });
  await titleB.waitFor({ timeout: 180_000 });
  console.log('P11-EVENTS | titre exact: OK');

  await page.waitForTimeout(6000);
  const evtLive = await page.locator('text=Temps réel').count();
  const evtNew = await page.locator('text=Créer un événement').count();
  console.log('P11-EVENTS | live:', evtLive, '| newBtn:', evtNew);

  // ── Page Locations ──
  await page.goto('/dashboard/rentals', { waitUntil: 'domcontentloaded' });
  const titleC = page.getByRole('heading', { level: 1, name: 'Centre des locations' });
  await titleC.waitFor({ timeout: 180_000 });
  console.log('P11-RENTALS | titre exact: OK');

  await page.waitForTimeout(6000);
  const renLive = await page.locator('text=Temps réel').count();
  const renNew = await page.locator('text=Nouvel article').count();
  console.log('P11-RENTALS | live:', renLive, '| newBtn:', renNew);

  console.log('P11-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
