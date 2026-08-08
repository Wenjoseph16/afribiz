import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P16 - Verification visuelle page Abonnements upgradee 2027
test('P16: abonnements en langage 2027', async ({ page, context }) => {
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

  // ── Page Abonnements : titre exact du PageHeader ──
  await page.goto('/dashboard/subscriptions', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'Centre des abonnements' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P16-SUBS | titre exact: OK');

  await page.waitForTimeout(6000);
  const live = await page.locator('text=Temps réel').count();
  const newPlan = await page.locator('text=Nouveau plan').count();
  const total = await page.locator('text=Total plans').count();
  console.log('P16-SUBS | live:', live, '| newBtn:', newPlan, '| kpi:', total);

  console.log('P16-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
