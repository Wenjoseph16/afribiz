import { test, expect } from '@playwright/test';
import { authenticateViaApi } from './auth-helpers';

test.setTimeout(900_000);

const DEV_ACCOUNT = { email: 'dev1@afribiz.com', password: 'Afribiz@2026!' };
const DRAFT_MODULE = 'devmod-5'; // ComptaPro (DRAFT, en attente de validation)

test('P23a: marketing dev - section campagnes publicitaires + formulaire', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, DEV_ACCOUNT);
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) {
          s.state.selectedSpace = 'DEVELOPER';
          localStorage.setItem('auth-storage', JSON.stringify(s));
        }
      }
    } catch {}
  });

  await page.goto('/dashboard/developer/marketing', { waitUntil: 'domcontentloaded' });
  const section = page.locator('text=Campagnes publicitaires').first();
  await section.waitFor({ timeout: 90_000 });
  console.log('P23a | Section campagnes: OK');

  const newBtn = page.locator('text=Nouvelle campagne').first();
  await newBtn.waitFor({ timeout: 30_000 });
  await newBtn.click();
  const nameInput = page.locator('input[placeholder="Ex : Lancement Stock Pro"]');
  await nameInput.waitFor({ timeout: 30_000 });
  console.log('P23a | Formulaire creation: OK');

  expect(errors).toHaveLength(0);
});

test('P23b: module DRAFT - bouton Soumettre a validation + publier bloque', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  await authenticateViaApi(context, DEV_ACCOUNT);
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) {
          s.state.selectedSpace = 'DEVELOPER';
          localStorage.setItem('auth-storage', JSON.stringify(s));
        }
      }
    } catch {}
  });

  await page.goto(`/dashboard/developer/modules/${DRAFT_MODULE}`, { waitUntil: 'domcontentloaded' });
  const title = page.locator('h1', { hasText: 'ComptaPro' }).first();
  await title.waitFor({ timeout: 90_000 });
  console.log('P23b | Page detail ComptaPro: OK');

  const submitBtn = page.locator('text=Soumettre à validation').first();
  await submitBtn.waitFor({ timeout: 30_000 });
  console.log('P23b | Bouton Soumettre à validation: OK');

  // Sécurité : la publication directe doit être bloquée (403) — le dev passe par la validation
  const token = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      const s = JSON.parse(raw || '');
      return s?.state?.accessToken || s?.state?.token || '';
    } catch {
      return '';
    }
  });
  const res = await context.request.post(
    `http://localhost:3001/api/developer/modules/${DRAFT_MODULE}/publish`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('P23b | POST publish status:', res.status());
  expect(res.status()).toBe(403);
  console.log('P23b | Sécurité publier direct bloqué (403): OK');

  expect(errors).toHaveLength(0);
});
