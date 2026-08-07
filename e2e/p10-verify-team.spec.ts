import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P10 - Verification visuelle pages Employes + Livraisons upgradees 2027
test('P10: employes + livraisons en langage 2027', async ({ page, context }) => {
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

  // ── Page Employes : attendre le titre exact du PageHeader ──
  await page.goto('/dashboard/employees', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'Centre de gestion des équipes' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P10-EMPLOYEES | titre exact: OK');

  await page.waitForTimeout(6000);
  const empLive = await page.locator('text=Temps réel').count();
  const empNew = await page.locator('text=Nouvel employé').count();
  console.log('P10-EMPLOYEES | live:', empLive, '| newBtn:', empNew);

  // ── Page Livraisons ──
  await page.goto('/dashboard/deliveries', { waitUntil: 'domcontentloaded' });
  const titleB = page.getByRole('heading', { level: 1, name: 'Centre des livraisons' });
  await titleB.waitFor({ timeout: 180_000 });
  console.log('P10-DELIVERIES | titre exact: OK');

  await page.waitForTimeout(6000);
  const delLive = await page.locator('text=Temps réel').count();
  const delNew = await page.locator('text=Nouvelle livraison').count();
  console.log('P10-DELIVERIES | live:', delLive, '| newBtn:', delNew);

  console.log('P10-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
