import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(420_000);

// P6 - Verification visuelle des pages Produits et Reservations relookees 2027
test('P6: produits + reservations en langage 2027', async ({ page, context }) => {
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

  // ── Page Produits ──
  await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12_000);
  const prodHeader = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '');
  const prodTable = await page.locator('table').count();
  const prodEmpty = await page.getByText('Aucun produit', { exact: false }).count();
  console.log('P6-PRODUITS | h1:', prodHeader, '| table:', prodTable, '| empty:', prodEmpty);

  // ── Page Reservations ──
  await page.goto('/dashboard/bookings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12_000);
  const bokHeader = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '');
  const bokTable = await page.locator('table').count();
  const bokLive = await page.getByText('Temps réel').count();
  const bokEmpty = await page.getByText('Aucune réservation', { exact: false }).count();
  console.log('P6-RESERV | h1:', bokHeader, '| table:', bokTable, '| live:', bokLive, '| empty:', bokEmpty);

  // ── Drawer produits : ouverture si table presente ──
  if (prodTable > 0) {
    await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10_000);
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2_500);
    const drawerProd = await page.getByText('Stock', { exact: false }).count();
    console.log('P6-DRAWER-PROD | stock info dans drawer:', drawerProd);
  }

  console.log('P6-PAGEERRORS:', errors.length ? errors.join(' | ') : 'aucune');

  // Assertions douces : les pages rendent (header present, pas de crash)
  expect(prodHeader.length).toBeGreaterThan(0);
  expect(bokHeader.length).toBeGreaterThan(0);
  expect(bokLive).toBeGreaterThan(0);
  expect(errors).toEqual([]);

  await page.screenshot({ path: 'test-results/p6-pages.png', fullPage: true }).catch(() => {});
});
