import { test, expect, request } from '@playwright/test';

/**
 * P26 — Flux complet Abonnements (vitrine → souscription → paiement → stats business)
 * API-only : rejouable, crée un compte client frais à chaque run.
 * Backend attendu sur :3001 (montage /api/business/subscriptions AVANT /api/business).
 */
test.setTimeout(120_000);

const API = 'http://localhost:3001/api';
const TS = Date.now();
const FRESH_EMAIL = `sub-test-${TS}@afribiz.com`;

async function apiCall(
  api: any,
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  token?: string,
  body?: any
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await api[method](`${API}${path}`, { headers, data: body });
  return { status: res.status(), json: await res.json() };
}

test('P26: client s abonne a un plan salon -> paie -> stats business enrichies', async () => {
  const api = await request.newContext();

  // 0. Client seed client4 — login puis annulation de tout abonnement existant (noop si aucun)
  const clientLogin = await apiCall(api, 'post', '/auth/login', undefined, {
    identifier: 'client4@afribiz.com',
    password: 'Afribiz@2026!',
  });
  expect(clientLogin.status, `login client4 échoué: ${JSON.stringify(clientLogin.json)}`).toBe(200);
  const clientToken = clientLogin.json.data?.accessToken;
  expect(clientToken).toBeTruthy();
  const reset = await apiCall(api, 'post', '/business/subscriptions/my-subscription/cancel', clientToken); // 404 si aucun

  // 1. Plans publics du salon (vitrine, sans auth)
  const plans = await apiCall(api, 'get', '/business/kenza-beaute/subscriptions');
  expect(plans.status).toBe(200);
  const plan = (plans.json.data || []).find((p: any) => p.name === 'Forfait Découverte');
  expect(plan, 'plan Découverte du salon introuvable').toBeTruthy();

  // 2. Souscription client (Mobile Money WAVE) → SUSPENDED + ref
  const sub = await apiCall(api, 'post', '/business/subscriptions/subscribe', clientToken, {
    planId: plan.id,
    provider: 'WAVE',
    phone: '0709000099',
  });
  expect(sub.status, `subscribe échoué: ${JSON.stringify(sub.json)}`).toBe(201);
  expect(sub.json.data?.needsConfirmation).toBe(true);
  const ref = sub.json.data?.providerRef;
  expect(ref).toBeTruthy();

  // 3. Confirmation du paiement → ACTIVE
  const confirm = await apiCall(
    api,
    'post',
    '/business/subscriptions/subscribe/confirm',
    clientToken,
    { providerRef: ref }
  );
  expect(confirm.status, `confirm échoué: ${JSON.stringify(confirm.json)}`).toBe(200);
  expect(confirm.json.data?.subscription?.status).toBe('ACTIVE');

  // 4. my-subscription côté client → ACTIVE
  const mine = await apiCall(api, 'get', '/business/subscriptions/my-subscription', clientToken);
  expect(mine.status).toBe(200);
  expect(mine.json.data?.status).toBe('ACTIVE');


  // 6. Stats business (le salon est le propriétaire de kenza-beaute)
  const bizLogin = await apiCall(api, 'post', '/auth/login', undefined, {
    identifier: 'salon@afribiz.com',
    password: 'Afribiz@2026!',
  });
  expect(bizLogin.status).toBe(200);
  const bizToken = bizLogin.json.data?.accessToken;
  const stats = await apiCall(api, 'get', '/business/subscriptions/stats', bizToken);
  expect(stats.status).toBe(200);
  const d = stats.json.data || {};
  expect(d.totalSubscribers).toBeGreaterThan(0);
  expect(d.mrr).toBeGreaterThan(0);
  expect(Array.isArray(d.revenueByPlan)).toBe(true);
  expect(Array.isArray(d.activeList)).toBe(true);

  await api.dispose();
});
