import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

// P19 - Lien Marketing ↔ WhatsApp Business : campagne envoyee via template
test('P19: campagne marketing envoyee via template WhatsApp', async ({ page, context, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 150)));

  // Login business via API
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

  // ── Créer une campagne DRAFT via API (pour avoir le bouton Envoyer WhatsApp) ──
  const login = await request.post('http://localhost:3001/api/auth/login', {
    data: { identifier: TEST_ACCOUNTS.business.email, password: TEST_ACCOUNTS.business.password },
  });
  const loginBody = await login.json();
  const token = loginBody?.data?.accessToken || '';
  const created = await request.post('http://localhost:3001/api/business/promotions/campaigns', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'P19 Campagne Test DRAFT', channels: ['WHATSAPP'] },
  });
  const createdBody = await created.json();
  console.log('P19-API | campagne DRAFT creee:', createdBody?.success === true ? 'OK' : 'FAIL');

  // ── Page Marketing : titre exact + campagnes visibles ──
  await page.goto('/dashboard/marketing', { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { level: 1, name: 'Marketing' });
  await title.waitFor({ timeout: 180_000 });
  console.log('P19-MARKETING | titre exact: OK');

  await page.waitForTimeout(6000);
  const mgSent = await page.locator('text=Envoyée').count();
  const mgDraftName = await page.locator('text=P19 Campagne Test DRAFT').count();
  const mgFilterEnvoyees = await page.locator('button:has-text("Envoyées")').count();
  const mgStatEnvoyees = await page.locator('text=Taux succès').count();
  console.log('P19-MARKETING | envoyees:', mgSent, '| draft presente:', mgDraftName > 0, '| filtreEnvoyees:', mgFilterEnvoyees, '| statTaux:', mgStatEnvoyees);

  // ── Bouton Envoyer WhatsApp sur la campagne DRAFT ──
  const sendBtn = page.getByRole('button', { name: /Envoyer WhatsApp/ }).first();
  await sendBtn.waitFor({ timeout: 30_000 });
  await sendBtn.click();
  await page.waitForTimeout(3000);
  // Le modal liste les templates APPROVED (confirmation_commande, plat_du_jour...) + bouton d'envoi
  const modalTpl = await page.locator('text=confirmation_commande').count();
  const modalSend = await page.locator('button:has-text("Envoyer à tous les clients")').count();
  console.log('P19-MARKETING-MODAL | templates:', modalTpl, '| sendBtn:', modalSend);
  expect(modalTpl).toBeGreaterThan(0);
  expect(modalSend).toBeGreaterThan(0);

  console.log('P19-PAGEERRORS:', errors.length === 0 ? 'aucune' : errors.slice(0, 2).join(' | '));
  expect(errors.length).toBe(0);
});
