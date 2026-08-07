import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P8 - Verification visuelle de la page Factures & Devis relookee 2027 (business-aware)
test('P8: finance (factures + devis) en langage 2027', async ({ page, context }) => {
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

  // ── Page Factures (onglet par defaut) ──
  await page.goto('/dashboard/invoices', { waitUntil: 'domcontentloaded' });
  const h1 = page.locator('h1');
  await h1.waitFor({ timeout: 180_000 });
  console.log('P8-FINANCE | h1:', (await h1.innerText()).trim());

  // KPIs
  const kpis = await page.locator('button[class*="rounded-2xl"]').count();
  console.log('P8-FINANCE | kpis:', kpis);

  // Table factures (seed: 1 facture pour le resto)
  await page.waitForTimeout(6000);
  const rows = await page.locator('tbody tr').count();
  const live = await page.locator('text=Temps réel').count();
  console.log('P8-FINANCE | rows(factures):', rows, '| live:', live);

  // Onglet Devis
  await page.getByRole('button', { name: /devis/i }).first().click();
  await page.waitForTimeout(4000);
  const quoteRows = await page.locator('tbody tr').count();
  console.log('P8-FINANCE | rows(devis):', quoteRows);

  // Drawer sur la premiere ligne
  if (rows > 0) {
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(1500);
    const drawerOpen = await page.locator('[role="dialog"]').count().then((n) => n > 0).catch(() => false);
    console.log('P8-FINANCE | drawer:', drawerOpen);
  }

  console.log('P8-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
