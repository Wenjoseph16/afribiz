import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P13 - Verification visuelle page Documents upgradee 2027
test('P13: documents en langage 2027', async ({ page, context }) => {
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

  // ── Page Documents : attendre le titre exact du PageHeader ──
  await page.goto('/dashboard/documents', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'Centre documentaire' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P13-DOCUMENTS | titre exact: OK');

  await page.waitForTimeout(6000);
  const docLive = await page.locator('text=Temps réel').count();
  const docKpis = await page.locator('text=Contrats').count();
  const docUpload = await page.locator('text=Uploader').count();
  const docTabs = await page.locator('text=Tous').count();
  console.log('P13-DOCUMENTS | live:', docLive, '| kpis:', docKpis, '| upload:', docUpload, '| tabs:', docTabs);

  console.log('P13-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
