import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P14 - Verification visuelle pages Finance + CRM upgradees 2027
test('P14: devis + dettes + CRM en langage 2027', async ({ page, context }) => {
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

  // ── Page Devis : titre exact du PageHeader ──
  await page.goto('/dashboard/quotes', { waitUntil: 'domcontentloaded' });
  const titleQ = page.getByRole('heading', { level: 1, name: 'Centre des devis' });
  await titleQ.waitFor({ timeout: 180_000 });
  console.log('P14-QUOTES | titre exact: OK');

  await page.waitForTimeout(5000);
  const qLive = await page.locator('text=Temps réel').count();
  const qNew = await page.locator('text=Nouveau devis').count();
  const qDevis = await page.locator('text=Devis').count();
  console.log('P14-QUOTES | live:', qLive, '| newBtn:', qNew, '| devis:', qDevis);

  // ── Page Dettes & Paiements ──
  await page.goto('/dashboard/debts-payments', { waitUntil: 'domcontentloaded' });
  const titleD = page.getByRole('heading', { level: 1, name: 'Centre des dettes & paiements' });
  await titleD.waitFor({ timeout: 180_000 });
  console.log('P14-DEBTS | titre exact: OK');

  await page.waitForTimeout(5000);
  const dLive = await page.locator('text=Temps réel').count();
  const dNew = await page.locator('text=Nouvelle dette').count();
  const dEcheance = await page.locator('text=Échéancier').count();
  console.log('P14-DEBTS | live:', dLive, '| newBtn:', dNew, '| echeancier:', dEcheance);

  // ── Page CRM ──
  await page.goto('/dashboard/crm', { waitUntil: 'domcontentloaded' });
  const titleC = page.getByRole('heading', { level: 1, name: 'Centre relation client' });
  await titleC.waitFor({ timeout: 180_000 });
  console.log('P14-CRM | titre exact: OK');

  await page.waitForTimeout(5000);
  const cLive = await page.locator('text=Temps réel').count();
  const cClients = await page.locator('text=Total clients').count();
  const cTags = await page.locator('text=Tags').count();
  console.log('P14-CRM | live:', cLive, '| clients:', cClients, '| tags:', cTags);

  console.log('P14-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
