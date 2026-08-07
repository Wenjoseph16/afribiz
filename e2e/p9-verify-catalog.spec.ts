import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P9 - Verification visuelle pages Menu + Services relookees 2027
test('P9: menu + services en langage 2027', async ({ page, context }) => {
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

  // ── Page Menu ──
  await page.goto('/dashboard/menu', { waitUntil: 'domcontentloaded' });
  const h1 = page.locator('h1');
  await h1.waitFor({ timeout: 180_000 });
  console.log('P9-MENU | h1:', (await h1.innerText()).trim());

  await page.waitForTimeout(6000);
  const menuLive = await page.locator('text=Temps réel').count();
  const menuNew = await page.locator('text=Nouveau plat').count();
  console.log('P9-MENU | live:', menuLive, '| newBtn:', menuNew);

  // ── Page Services ──
  await page.goto('/dashboard/services', { waitUntil: 'domcontentloaded' });
  const h1b = page.locator('h1');
  await h1b.waitFor({ timeout: 180_000 });
  console.log('P9-SERVICES | h1:', (await h1b.innerText()).trim());

  await page.waitForTimeout(6000);
  const svcLive = await page.locator('text=Temps réel').count();
  const svcNew = await page.locator('text=Nouveau service').count();
  console.log('P9-SERVICES | live:', svcLive, '| newBtn:', svcNew);

  console.log('P9-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
