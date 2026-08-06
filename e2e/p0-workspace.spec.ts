import { test, expect } from '@playwright/test';

// P0 — Fondation workspace (Workflow Business)
const BUSINESS_EMAIL = 'resto@afribiz.com';
const PASSWORD = 'Afribiz@2026!';

test.setTimeout(300_000);

async function waitPath(page: any, re: RegExp, timeout = 45_000) {
  await page.waitForFunction((r: string) => new RegExp(r).test(location.pathname), re.source, {
    timeout,
  });
}

async function login(page: any) {
  await page.goto('/login');
  await page.getByPlaceholder('exemple@email.com').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(2000); // laisser l'hydratation (recompilation Next dev)
  await page.getByPlaceholder('exemple@email.com').fill(BUSINESS_EMAIL);
  await page.getByPlaceholder('Entrez votre mot de passe').fill(PASSWORD);
  // Retry de clic : robuste si l'hydratation n'est pas terminée au premier essai
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /se connecter/i }).first().click();
    try {
      await page.waitForFunction(() => !location.pathname.startsWith('/login'), null, {
        timeout: 25_000,
      });
      break;
    } catch {
      /* re-essayer */
    }
  }
  await page.waitForTimeout(2500);
}

const NOISE =
  'favicon|manifest|Failed to load resource|status of 404|DevTools|auto-scroll|scroll-behavior|Skipping|Download the React DevTools|Next.js Dev Tools';

function isRealError(e: string) {
  return /typeerror|referenceerror|not valid as a react child|minified react error|uncaught|failed to fetch|hydrat|errcould/i.test(e);
}

test('P0: espace business - 10 poles + zero rebond + switch', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });

  await login(page);

  const sidebar = page.locator('aside').first();

  // 1. Espace Business actif dès le login (gérant)
  await expect(sidebar.locator('button', { hasText: /^Business$/ }).first()).toHaveClass(/emerald/);

  // 2. Les 10 pôles
  const poles = ['Pilotage','Catalogue','Ventes','Clients & CRM','Marketing','Finance','Équipe','Social Commerce','Croissance','Config & Intégrations'];
  for (const pole of poles) {
    await expect(sidebar.getByText(pole, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  }

  // 3. Produits (chemin partagé) -> RESTE espace business (zéro rebond)
  await sidebar.locator('a[href="/dashboard/products"]').first().click();
  await waitPath(page, /^\/dashboard\/products/);
  await page.waitForTimeout(2000);
  await expect(sidebar.getByText('Pilotage', { exact: true }).first()).toBeVisible();
  await expect(sidebar.locator('button', { hasText: /^Business$/ }).first()).toHaveClass(/emerald/);

  // 4. Commandes (pôle Ventes) -> reste business
  await sidebar.locator('a[href="/dashboard/business/orders"]').first().click();
  await waitPath(page, /^\/dashboard\/business\/orders/);
  await page.waitForTimeout(2000);
  await expect(sidebar.getByText('Pilotage', { exact: true }).first()).toBeVisible();

  // 5. Retour tableau de bord business
  await sidebar.locator('a[href="/dashboard/business"]').first().click();
  await waitPath(page, /^\/dashboard\/business$/);
  await page.waitForTimeout(2000);

  // 6. Switch Client -> nav client
  await sidebar.locator('button', { hasText: /^Client$/ }).first().click();
  await waitPath(page, /^\/dashboard$/);
  await page.waitForTimeout(2000);
  for (const grp of ['Activités','Finances','Découverte']) {
    await expect(sidebar.getByText(grp, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  }

  // 7. Retour Business -> les pôles reviennent
  await sidebar.locator('button', { hasText: /^Business$/ }).first().click();
  await waitPath(page, /^\/dashboard\/business/);
  await page.waitForTimeout(2000);
  await expect(sidebar.getByText('Pilotage', { exact: true }).first()).toBeVisible();

  const blocking = consoleErrors.filter((e) => !new RegExp(NOISE, 'i').test(e));
  const realErrors = blocking.filter(isRealError);
  console.log('BLOCKING-ERRORS:', JSON.stringify(blocking.slice(0, 10)));
  console.log('REAL-ERRORS:', JSON.stringify(realErrors.slice(0, 5)));
  expect(realErrors.length).toBeLessThanOrEqual(2);
});
