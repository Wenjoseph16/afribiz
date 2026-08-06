import { test, expect } from '@playwright/test';

// P1 — Socle plan & parcours (Workflow Business)
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

test('P1: onboarding business - garde de role ne bloque pas + page formulaire accessible', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e.message).slice(0, 160)));

  // 1. Connexion business existant (resto)
  await login(page, 'resto@afribiz.com');
  await page.waitForFunction(() => location.pathname.startsWith('/dashboard'), null, { timeout: 30_000 });
  console.log('URL_APRES_LOGIN:', page.url());

  // 2. Le dashboard business ne boucle pas vers onboarding (le business existe)
  await page.waitForTimeout(3000);
  const path = new URL(page.url()).pathname;
  expect(path).not.toBe('/dashboard/business/onboarding');
  console.log('PAS_DE_BOUCLE: OK (chemin =', path + ')');

  // 3. Acces direct au formulaire onboarding (route business/onboarding) - doit rendre le wizard
  await page.goto('/dashboard/business/onboarding');
  await page.waitForTimeout(4000);
  const hasWizard = await page.getByText(/Identité|Lancer votre business|Créer mon business/).first().isVisible().catch(() => false);
  console.log('WIZARD_VISIBLE:', hasWizard);
  expect(hasWizard).toBe(true);

  console.log('ERR_CONSOLE:', errs.length ? errs.slice(0, 3).join(' | ') : 'aucune');
});
