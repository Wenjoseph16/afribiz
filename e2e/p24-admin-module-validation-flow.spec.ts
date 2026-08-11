import { test, expect } from '@playwright/test';
import { authenticateViaApi } from './auth-helpers';

test.setTimeout(900_000);

const DEV_ACCOUNT = { email: 'dev1@afribiz.com', password: 'Afribiz@2026!' };
const ADMIN_ACCOUNT = { email: 'admin@afribiz.com', password: 'Afribiz@2026!' };
const API = 'http://localhost:3001/api';

async function apiLogin(email: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: 'Afribiz@2026!' }),
  });
  const j = await res.json();
  return j?.data?.accessToken || '';
}

test('P24: flux complet validation admin - soumission dev -> PENDING_REVIEW -> admin publie -> marketplace', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  const name = `E2E Validation ${Date.now()}`;
  let moduleId = '';
  let slug = '';

  // ── SETUP API : dev1 cree un module puis le soumet a validation ──
  const devToken = await apiLogin('dev1@afribiz.com');
  expect(devToken.length).toBeGreaterThan(10);
  const createRes = await fetch(`${API}/developer/modules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${devToken}` },
    body: JSON.stringify({
      name,
      category: 'Gestion',
      shortDescription: 'Module de test du flux de validation complet admin e2e',
      pricingType: 'ONE_TIME',
      price: 5000,
    }),
  });
  const created = await createRes.json();
  moduleId = created?.data?.id || '';
  expect(moduleId).toBeTruthy();
  console.log('P24 | module cree:', moduleId);

  const submitRes = await fetch(`${API}/developer/modules/${moduleId}/validation/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
  });
  expect(submitRes.ok).toBe(true);
  const stRes = await fetch(`${API}/developer/modules/${moduleId}`, {
    headers: { Authorization: `Bearer ${devToken}` },
  });
  const st = await stRes.json();
  expect(st?.data?.status).toBe('PENDING_REVIEW');
  slug = st?.data?.slug || '';
  console.log('P24 | soumission OK -> PENDING_REVIEW, slug:', slug);

  // ── ADMIN UI : voir le module en revue et le valider ──
  await authenticateViaApi(context, ADMIN_ACCOUNT);
  await context.addInitScript(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.state) {
          s.state.selectedSpace = 'ADMIN';
          localStorage.setItem('auth-storage', JSON.stringify(s));
        }
      }
    } catch {}
  });

  await page.goto('/dashboard/admin/modules', { waitUntil: 'domcontentloaded' });
  const search = page.locator('input[placeholder="Rechercher par nom ou développeur..."]');
  await search.waitFor({ timeout: 90_000 });
  await search.fill(name);
  await search.press('Enter'); // la recherche admin exige Entree pour appliquer le filtre
  await page.waitForTimeout(500);

  const row = page.locator('tr', { hasText: name }).first();
  await row.waitFor({ timeout: 60_000 });
  console.log('P24 | admin voit le module en revue');

  const validerBtn = row
    .locator('button')
    .filter({ has: page.locator('svg.text-emerald-500') })
    .first();
  await validerBtn.waitFor({ timeout: 30_000 });
  await validerBtn.click();
  console.log('P24 | bouton valider clique');

  const confirmBtn = page.locator('button', { hasText: 'Confirmer' }).last();
  await confirmBtn.waitFor({ timeout: 30_000 });
  await confirmBtn.click();
  console.log('P24 | confirmation modal clique');

  const toast = page.locator('text=Module valider avec succès').first();
  await toast.waitFor({ timeout: 30_000 });
  console.log('P24 | toast succes affiche');

  // ── VERIF API : PUBLISHED + isPublished ──
  const st2Res = await fetch(`${API}/developer/modules/${moduleId}`, {
    headers: { Authorization: `Bearer ${devToken}` },
  });
  const st2 = await st2Res.json();
  expect(st2?.data?.status).toBe('PUBLISHED');
  expect(st2?.data?.isPublished).toBe(true);
  console.log('P24 | API: PUBLISHED + isPublished=true');

  // ── VERIF UI : page publique marketplace ──
  await page.goto(`/marketplace/${slug}`, { waitUntil: 'domcontentloaded' });
  const pubTitle = page.locator('h1', { hasText: name }).first();
  await pubTitle.waitFor({ timeout: 90_000 });
  console.log('P24 | module visible sur la page publique marketplace');

  expect(errors).toHaveLength(0);

  // ── NETTOYAGE : archiver le module de test ──
  const adminToken = await apiLogin('admin@afribiz.com');
  await fetch(`${API}/admin/modules/${moduleId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ action: 'archiver' }),
  });
  console.log('P24 | module de test archive (nettoyage)');
});
