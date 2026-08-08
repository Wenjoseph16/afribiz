import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P12 - Verification visuelle du hub Finance upgrade 2027
test('P12: hub finance en langage 2027', async ({ page, context }) => {
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

  // ── Page Finance (hub) : attendre le titre exact du PageHeader ──
  await page.goto('/dashboard/finance', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: "Centre financier" });
  await title.waitFor({ timeout: 180_000 });
  console.log('P12-FINANCE | titre exact: OK');

  await page.waitForTimeout(6000);
  const finLive = await page.locator('text=Temps réel').count();
  const finKpis = await page.locator('text=Revenu total').count();
  const finQuotes = await page.locator('text=Derniers devis').count();
  const finInvoices = await page.locator('text=Dernières factures').count();
  const finActions = await page.locator('text=Nouveau devis').count() + await page.locator('text=Nouvelle facture').count() + await page.locator('text=Dettes & Paiements').count();
  console.log('P12-FINANCE | live:', finLive, '| kpis:', finKpis, '| quotes:', finQuotes, '| invoices:', finInvoices, '| actions:', finActions);

  console.log('P12-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
