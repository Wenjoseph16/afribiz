import { test, expect } from '@playwright/test';

// P2 — Cockpit business : brief du matin + alert queue + plan
const PASSWORD = 'Afribiz@2026!';

test.setTimeout(300_000);

async function login(page: any, email: string) {
  await page.goto('/login');
  await page.getByPlaceholder('exemple@email.com').waitFor({ timeout: 90_000 });
  await page.waitForTimeout(2000);
  await page.getByPlaceholder('exemple@email.com').fill(email);
  await page.getByPlaceholder('Entrez votre mot de passe').fill(PASSWORD);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /se connecter/i }).click();
    try {
      await page.waitForFunction(() => !location.pathname.startsWith('/login'), null, { timeout: 25_000 });
      break;
    } catch {
      // retry
    }
  }
  await page.waitForTimeout(2500);
}

test('P2: cockpit business - brief du matin, alert queue, plan AfriBiz', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e.message).slice(0, 200)));

  await login(page, 'resto@afribiz.com');
  await page.goto('/dashboard/business');
  await page.waitForTimeout(6000);

  // 1. Brief du matin
  const brief = await page.getByText('Brief du matin').count();
  console.log('BRIEF_DU_MATIN:', brief);

  // 2. Alert queue
  const queue = await page.getByText("À traiter aujourd'hui").count();
  console.log('ALERT_QUEUE:', queue);

  // 3. Plan AfriBiz
  const plan = await page.getByText(/Plan AfriBiz/).count();
  const promo = await page.getByText('Promo', { exact: true }).count();
  console.log('PLAN_AFRIBIZ:', plan, '| PROMO_BADGE:', promo);

  expect(brief).toBeGreaterThan(0);
  expect(queue).toBeGreaterThan(0);
  expect(plan).toBeGreaterThan(0);

  console.log('CONSOLE_ERRORS:', errs.length ? errs.slice(0, 5) : 'NONE');
});
