import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P18 - Verification pages WhatsApp Business (espace business) + Parrainage (espace client)
test('P18: whatsapp business en langage 2027', async ({ page, context }) => {
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

  // ── Page WhatsApp Business : titre exact du PageHeader ──
  await page.goto('/dashboard/whatsapp', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'WhatsApp Business' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P18-WHATSAPP | titre exact: OK');

  await page.waitForTimeout(6000);
  const waLive = await page.locator('text=Temps réel').count();
  const waNew = await page.locator('text=Nouveau template').count();
  const waEmpty = await page.locator('text=Aucun template').count();
  console.log('P18-WHATSAPP | live:', waLive, '| newBtn:', waNew, '| empty:', waEmpty);

  // ── Sidebar : l item WhatsApp Business est visible ──
  await page.waitForTimeout(2000);
  const waSidebar = await page.locator('text=WhatsApp Business').count();
  console.log('P18-SIDEBAR | whatsapp visible:', waSidebar > 0);

  console.log('P18-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});

// P18b - Page Parrainage avec le compte client (code auto-genere)
test('P18b: parrainage (compte client, code genere)', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, { email: TEST_ACCOUNTS.client.email, password: TEST_ACCOUNTS.client.password });
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) { s.state.selectedSpace = 'CLIENT'; localStorage.setItem('auth-storage', JSON.stringify(s)); }
      }
    } catch {}
  });

  await page.goto('/dashboard/referrals', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'Parrainage' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P18-REFERRALS | titre exact: OK');

  await page.waitForTimeout(6000);
  const rfLive = await page.locator('text=Temps réel').count();
  const rfCode = await page.locator('text=Votre code de parrainage').count();
  const rfInvite = await page.locator('text=Inviter').count();
  console.log('P18-REFERRALS | live:', rfLive, '| code:', rfCode, '| invite:', rfInvite);

  console.log('P18B-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
