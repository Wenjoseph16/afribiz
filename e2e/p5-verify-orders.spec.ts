import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

// P5 - Page commandes business relookee 2027 : verification visuelle et fonctionnelle
const EMAIL = TEST_ACCOUNTS.business.email; // resto@afribiz.com
const PASSWORD = TEST_ACCOUNTS.business.password;

test.setTimeout(900_000);

test('P5: page commandes 2027 - header, KPIs, table dense, LiveBadge, Drawer 360', async ({
  page,
  context,
}) => {
  const issues: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 150)));

  // Auth deterministe via API (cookie + localStorage injectes) - evite la flakiness UI
  await authenticateViaApi(context, { email: EMAIL, password: PASSWORD });

  // Espace business force (le modele workspace persiste selectedSpace dans auth-storage)
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) {
          s.state.selectedSpace = 'BUSINESS';
          localStorage.setItem('auth-storage', JSON.stringify(s));
        }
      }
    } catch {}
  });

  // 1. Aller sur la page commandes
  const resp = await page.goto('/dashboard/orders', { waitUntil: 'domcontentloaded' });
  expect(resp?.status()).not.toBe(404);
  await page.waitForTimeout(6000);

  // 3. PageHeader 2027 (avec diagnostic si absent)
  try {
    await page.getByRole('heading', { name: /centre de traitement des commandes/i }).waitFor({ timeout: 90_000 });
  } catch {
    const url = page.url();
    const body = await page.locator('#main-content, main, body').first().innerText().catch(() => '');
    console.log('[P5-DIAG] url=' + url);
    console.log('[P5-DIAG] main-content debut: ' + body.slice(0, 400).replace(/\n+/g, ' | '));
    console.log('[P5-DIAG] pageErrors: ' + pageErrors.slice(0, 3).join(' || '));
    throw new Error('PageHeader introuvable sur /dashboard/orders (url=' + url + ')');
  }
  console.log('  OK  PageHeader present');

  // 3. KPIs temps reel
  for (const label of [/en attente de traitement/i, /reçues aujourd'hui/i, /en cours/i, /ca aujourd'hui/i]) {
    await page.getByText(label).first().waitFor({ timeout: 30_000 });
  }
  console.log('  OK  4 KPIs temps reel presents');

  // 4. LiveBadge Temps reel
  await page.getByText('Temps réel').first().waitFor({ timeout: 30_000 });
  const pulseDot = page.locator('span.animate-ping').first();
  await pulseDot.waitFor({ timeout: 15_000 }).catch(() => {});
  console.log('  OK  LiveBadge Temps reel present (point pulsant: ' + (await pulseDot.count()) + ')');

  // 5. Table dense + en-tetes
  const table = page.locator('table');
  await table.waitFor({ timeout: 60_000 });
  const headers = await table.locator('thead th').allInnerTexts();
  const joined = headers.join(' | ');
  console.log('  OK  Table dense, colonnes: ' + joined);
  for (const col of ['Commande', 'Client', 'Type', 'Statut', 'Montant', 'Actions']) {
    if (!joined.includes(col)) issues.push('Colonne manquante: ' + col);
  }

  // 6. Statuts en LiveBadge
  const rows = table.locator('tbody tr');
  const rowCount = await rows.count();
  console.log('  OK  ' + rowCount + ' commande(s) dans la table');
  if (rowCount > 0) {
    const liveBadges = await table.locator('tbody span.animate-ping').count().catch(() => 0);
    console.log('  OK  ' + liveBadges + ' point(s) pulsant(s) (LiveBadge) dans les statuts');

    // 7. Click ligne 1 -> Drawer 360
    await rows.first().click();
    const drawer = page.locator('aside[role="dialog"]');
    await drawer.waitFor({ timeout: 30_000 });
    const drawerText = await drawer.innerText();
    console.log('  OK  Drawer 360 ouvert');
    // NB: les labels de sections sont en uppercase via CSS -> comparaison insensible a la casse
    const low = drawerText.toLowerCase();
    for (const expected of ['client', 'articles', 'total de la commande']) {
      if (!low.includes(expected)) issues.push('Drawer sans section: ' + expected);
    }
    const traiter = drawer.getByRole('button', { name: /traiter la commande/i });
    if ((await traiter.count()) > 0) {
      console.log('  OK  Bouton "Traiter la commande" present (commande PENDING)');
    }
    await page.screenshot({ path: 'test-results/p5-orders-drawer.png', fullPage: false });

    // 8. Fermer le drawer
    await page.keyboard.press('Escape').catch(() => {});
    await drawer.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  await page.screenshot({ path: 'test-results/p5-orders-page.png', fullPage: true });

  if (pageErrors.length) {
    console.log('[P5] pageerrors (' + pageErrors.length + '): ' + pageErrors.slice(0, 3).join(' | '));
    issues.push('pageerrors: ' + pageErrors.slice(0, 3).join(' | '));
  }

  if (issues.length) {
    console.log('[P5] PROBLEMES:\n' + issues.join('\n'));
    throw new Error('P5 verification:\n' + issues.join('\n'));
  }
  console.log('[P5] VERIFICATION COMPLETE - page commandes 2027 OK');
});
