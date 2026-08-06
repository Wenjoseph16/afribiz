import { test, expect, Page } from '@playwright/test';

// P3 - Cockpit business : chaque lien des widgets mene a une vraie page (zero 404)
const PASSWORD = 'Afribiz@2026!';
const EMAIL = 'resto@afribiz.com';

test.setTimeout(900_000);

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('exemple@email.com').waitFor({ timeout: 90_000 });
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('exemple@email.com').fill(EMAIL);
  await page.getByPlaceholder('Entrez votre mot de passe').fill(PASSWORD);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /se connecter/i }).click();
    try {
      await page.waitForFunction(() => !location.pathname.startsWith('/login'), null, { timeout: 30_000 });
      break;
    } catch {
      // rate-limit ou session : on reessaie
    }
  }
  await page.waitForTimeout(2500);
}

test('P3: tous les liens du cockpit business -> zero page 404', async ({ page }) => {
  const issues: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 150)));

  // 1. Login puis cockpit
  await login(page);
  await page.goto('/dashboard/business');
  await page.locator('#main-content').waitFor({ timeout: 120_000 });
  await page.getByText('Brief du matin').first().waitFor({ timeout: 60_000 });
  await page.getByText(/traiter aujourd/i).first().waitFor({ timeout: 30_000 });
  await page.getByText('Plan AfriBiz').first().waitFor({ timeout: 30_000 });

  // 2. Collecter les liens uniques du cockpit (zone main, sidebar exclue)
  const hrefs = await page
    .locator('#main-content a[href^="/dashboard"]')
    .evaluateAll((as) => Array.from(new Set(as.map((a) => a.getAttribute('href')!))));
  expect(hrefs.length).toBeGreaterThan(3);
  console.log('[P3] ' + hrefs.length + ' liens uniques: ' + hrefs.join(' | '));

  // 3. Naviguer directement sur chaque lien et verifier l'absence de 404
  for (const href of hrefs) {
    try {
      const resp = await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500); // compile Next dev
      const body = await page.locator('body').innerText().catch(() => '');
      const notFound =
        body.includes('Page introuvable') ||
        body.includes("Cette page n'existe pas") ||
        body.includes('_not-found');
      const url = page.url();
      if (notFound) {
        issues.push('404 DETECTE: ' + href + ' (url=' + url + ', status=' + (resp ? resp.status() : '?') + ')');
      } else if (!body.trim()) {
        issues.push('PAGE VIDE: ' + href);
      } else {
        console.log('  OK  ' + href);
      }
    } catch (e) {
      issues.push('ERREUR NAV: ' + href + ' -> ' + String(e).slice(0, 150));
    }
  }

  // 4. Rapport
  console.log('[P3] ' + (hrefs.length - issues.length) + '/' + hrefs.length + ' liens OK');
  if (pageErrors.length) console.log('[P3] pageerrors (' + pageErrors.length + '): ' + pageErrors.slice(0, 3).join(' | '));
  if (issues.length) {
    console.log('[P3] PROBLEMES:\n' + issues.join('\n'));
    throw new Error('Liens casses du cockpit:\n' + issues.join('\n'));
  }
});
