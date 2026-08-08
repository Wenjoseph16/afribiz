import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P17 - Verification visuelle pages Tontine, Agents, Shorts, Unites upgradees 2027
test('P17: tontine + agents + shorts + unites en langage 2027', async ({ page, context }) => {
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

  // ── Page Tontine & Epargne ──
  await page.goto('/dashboard/savings', { waitUntil: 'domcontentloaded' });
  const titleS = page.getByRole('heading', { level: 1, name: 'Tontine & Épargne Collective' });
  await titleS.waitFor({ timeout: 180_000 });
  console.log('P17-SAVINGS | titre exact: OK');
  await page.waitForTimeout(4000);
  const sLive = await page.locator('text=Temps réel').count();
  const sNew = await page.locator('text=Nouveau groupe').count();
  console.log('P17-SAVINGS | live:', sLive, '| newBtn:', sNew);

  // ── Page Reseau Agents ──
  await page.goto('/dashboard/agents', { waitUntil: 'domcontentloaded' });
  const titleA = page.getByRole('heading', { level: 1, name: "Réseau d'Agents" });
  await titleA.waitFor({ timeout: 180_000 });
  console.log('P17-AGENTS | titre exact: OK');
  await page.waitForTimeout(4000);
  const aLive = await page.locator('text=Temps réel').count();
  const aNew = await page.locator('text=Nouvel agent').count();
  console.log('P17-AGENTS | live:', aLive, '| newBtn:', aNew);

  // ── Page Shorts Business ──
  await page.goto('/dashboard/shorts', { waitUntil: 'domcontentloaded' });
  const titleH = page.getByRole('heading', { level: 1, name: 'Shorts Business' });
  await titleH.waitFor({ timeout: 180_000 });
  console.log('P17-SHORTS | titre exact: OK');
  await page.waitForTimeout(4000);
  const hLive = await page.locator('text=Temps réel').count();
  const hFeed = await page.locator('text=Feed').count();
  console.log('P17-SHORTS | live:', hLive, '| feed:', hFeed);

  // ── Page Unites de Mesure ──
  await page.goto('/dashboard/units', { waitUntil: 'domcontentloaded' });
  const titleU = page.getByRole('heading', { level: 1, name: 'Unités de Mesure Africaines' });
  await titleU.waitFor({ timeout: 180_000 });
  console.log('P17-UNITS | titre exact: OK');
  await page.waitForTimeout(4000);
  const uLive = await page.locator('text=Temps réel').count();
  const uConvert = await page.locator('text=Convertir').count();
  console.log('P17-UNITS | live:', uLive, '| convert:', uConvert);

  console.log('P17-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
