import { test, expect } from '@playwright/test';

test.setTimeout(600_000);

const API = 'http://localhost:3001/api';

test('P25a: vitrine business - menu client-only (pas de modules internes) + QR partage', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));

  await page.goto('/business/saveur-dabidjan', { waitUntil: 'domcontentloaded' });

  const nav = page.locator('nav[aria-label="Navigation sections"]');
  await nav.waitFor({ timeout: 90_000 });

  // Sections client visibles (catalogues avec donnees)
  await expect(nav.getByRole('tab', { name: 'Accueil' })).toBeVisible();
  await expect(nav.getByRole('tab', { name: 'Menu' })).toBeVisible({ timeout: 60_000 });
  await expect(nav.getByRole('tab', { name: 'Produits' })).toBeVisible({ timeout: 60_000 });
  await expect(nav.getByRole('tab', { name: 'FAQ' })).toBeVisible();
  await expect(nav.getByRole('tab', { name: 'Contact' })).toBeVisible();
  await expect(nav.getByRole('tab', { name: 'Avis' })).toBeVisible();

  // Les modules INTERNES ne doivent JAMAIS apparaitre dans la vitrine publique
  for (const hidden of [
    'CRM',
    'MARKETING',
    'AFRISCORE',
    'EMPLOYEES',
    'PLANNING',
    'ORDERS',
    'DOCUMENTS',
    'DEBTS_PAYMENTS',
    'QUOTES_INVOICES',
    'DELIVERIES',
    'SAVINGS',
    'VOICE',
    'GROUP_BUY',
    'MEDIA',
    'ADVANCED_TASKS',
  ]) {
    await expect(nav.getByRole('tab', { name: hidden })).toHaveCount(0);
  }

  // Lien + QR code unique de la vitrine
  const shareBtn = page.locator('button[aria-label="Partager et QR code de la vitrine"]');
  await shareBtn.waitFor({ timeout: 30_000 });
  await shareBtn.click();

  const dialog = page.locator('[role="dialog"][aria-label^="Partager"]');
  await dialog.waitFor({ timeout: 30_000 });
  await expect(dialog.locator('svg').first()).toBeVisible(); // QR code + icones
  await expect(dialog.getByText(/business\/saveur-dabidjan/)).toBeVisible();
  await expect(dialog.getByText(/Scannez pour découvrir/)).toBeVisible();

  await dialog.locator('button[aria-label="Fermer"]').click();
  await expect(dialog).toHaveCount(0);

  console.log('P25a | vitrine: nav client-only OK + QR partage OK');

  const blocking = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('Failed to load resource') &&
      !e.includes('404') &&
      !e.includes('DevTools') &&
      !e.includes('auto-scroll')
  );
  expect(blocking).toHaveLength(0);
});

test('P25b: marketplace public - filtres catalogue + recherche + detail produit', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));

  await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });

  const search = page.locator(
    'input[placeholder="Rechercher un business, produit, service, ville..."]'
  );
  await search.waitFor({ timeout: 90_000 });

  // Categories rapides couvrant tous les catalogues
  await expect(page.getByRole('button', { name: 'Formation' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hôtels' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Événements' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Location' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Produits' }).first()).toBeVisible();

  // Recherche d'un produit reel du seed
  await search.fill('Attiéké');
  const result = page.getByText('Attiéké Poisson Braisé').first();
  await result.waitFor({ timeout: 60_000 });
  console.log('P25b | recherche produit OK');

  // Detail produit publique (pas de 404, h1 avec le nom)
  await page.goto('/product/attieke-poisson-braise', { waitUntil: 'domcontentloaded' });
  const h1 = page.locator('h1', { hasText: 'Attiéké Poisson Braisé' }).first();
  await h1.waitFor({ timeout: 90_000 });
  console.log('P25b | detail produit OK');

  const blocking = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('Failed to load resource') &&
      !e.includes('404') &&
      !e.includes('DevTools') &&
      !e.includes('auto-scroll')
  );
  expect(blocking).toHaveLength(0);
});

test('P25c: API marketplace - types room + training filtrables', async () => {
  // Chambres (hebergement)
  const roomRes = await fetch(`${API}/marketplace/search?type=room&limit=5`);
  const roomJson = await roomRes.json();
  expect(roomJson.success).toBe(true);
  const rooms = roomJson.data || [];
  expect(rooms.length).toBeGreaterThan(0);
  expect(rooms[0]._type).toBe('room');
  console.log('P25c | rooms:', rooms.length, '|', rooms[0]?.name);

  // Formations
  const trRes = await fetch(`${API}/marketplace/search?type=training&limit=5`);
  const trJson = await trRes.json();
  expect(trJson.success).toBe(true);
  const trainings = trJson.data || [];
  expect(trainings.length).toBeGreaterThan(0);
  expect(trainings[0]._type).toBe('training');
  console.log('P25c | trainings:', trainings.length, '|', trainings[0]?.title);
});
