import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P7 - Verification visuelle pages Promotions + Clients relookees 2027
test('P7: promotions + clients en langage 2027', async ({ page, context }) => {
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

  // ── Page Promotions : attendre le h1 (compile Next au 1er acces) ──
  await page.goto('/dashboard/promotions', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 180_000 });
  await page.waitForTimeout(4_000);
  const promHeader = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '');
  const promLive = await page.getByText('Temps réel').count();
  const promTable = await page.locator('table').count();
  const promNewBtn = await page.getByRole('link', { name: /Nouvelle promotion/ }).count();
  console.log('P7-PROMO | h1:', promHeader, '| live:', promLive, '| table:', promTable, '| newBtn:', promNewBtn);

  // ── Page Clients ──
  await page.goto('/dashboard/clients', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 180_000 });
  await page.waitForTimeout(4_000);
  const cliHeader = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '');
  const cliLive = await page.getByText('Temps réel').count();
  const cliTable = await page.locator('table').count();
  console.log('P7-CLIENT | h1:', cliHeader, '| live:', cliLive, '| table:', cliTable);

  // ── Drawer client : ouverture si table presente ──
  if (cliTable > 0) {
    await page.locator('tbody tr').first().click();
    await page.getByText('Total dépensé', { exact: false }).first().waitFor({ timeout: 15_000 });
    console.log('P7-DRAWER-CLIENT | drawer ouvert');
  }

  console.log('P7-PAGEERRORS:', errors.length ? errors.join(' | ') : 'aucune');

  expect(promHeader.length).toBeGreaterThan(0);
  expect(promLive).toBeGreaterThan(0);
  expect(promNewBtn).toBeGreaterThan(0);
  expect(cliHeader.length).toBeGreaterThan(0);
  expect(cliLive).toBeGreaterThan(0);
  expect(errors).toEqual([]);

  await page.screenshot({ path: 'test-results/p7-pages.png', fullPage: true }).catch(() => {});
});
