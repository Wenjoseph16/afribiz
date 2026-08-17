const BASE = 'http://localhost:3001/api';
const EMAIL = 'resto@afribiz.com';
const PASSWORD = 'Afribiz@2026!';

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  OK ' + name); }
  else { fail++; console.log('  FAIL ' + name + ' ' + extra); }
}

async function api(path, { method = 'GET', body, token, bizId } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(bizId ? { 'x-business-id': bizId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

async function main() {
  const login = await api('/auth/login', { method: 'POST', body: { identifier: EMAIL, password: PASSWORD } });
  const token = login.body?.data?.accessToken || login.body?.data?.token;
  check('Login', !!token, JSON.stringify(login.body || login.status));

  const me = await api('/business/me', { token });
  const bizList = Array.isArray(me.body?.data?.businesses) ? me.body?.data?.businesses : [];
  // Business cible : le resto (celui sans nom de test), sinon le premier
  const mainBizId = (bizList.find((b) => b.name && !b.name.includes('Integrite')) || bizList[0] || me.body?.data)?.id;
  check('Business principal trouve', !!mainBizId, JSON.stringify(me.body).slice(0, 200));

  const uniq = Date.now().toString().slice(-6);

  // GARANTIE 1 : ANTI-TRICHE
  const productRes = await api('/business/products', {
    method: 'POST', token, bizId: mainBizId,
    body: { name: 'Integrite ' + uniq, price: 15000, currency: 'FCFA', stock: 100, unit: 'piece' },
  });
  const product = productRes.body?.data?.product || productRes.body?.data;
  const productId = product?.id || productRes.body?.data?.id;
  check('Produit 15000 cree', !!productId, JSON.stringify(productRes.body).slice(0, 200));

  if (productId) {
    const cheatOrder = await api('/business/orders', {
      method: 'POST', token, bizId: mainBizId,
      body: {
        type: 'PICKUP', source: 'WALK_IN', paymentMethod: 'CASH', customerName: 'Client Tricheur',
        items: [{ productId, name: product.name || 'Produit', quantity: 1, unitPrice: 1 }],
      },
    });
    const cheatTotal = Number(cheatOrder.body?.data?.totalAmount ?? NaN);
    check('ANTI-TRICHE : 1 F envoye -> total recalcule 15000', cheatTotal === 15000, 'recu: ' + cheatTotal);

    const products = await api('/business/products', { token, bizId: mainBizId });
    const list = Array.isArray(products.body?.data) ? products.body.data : (products.body?.data?.products || []);
    const after = list.find((p) => p.id === productId);
    check('Stock decremente (100 -> 99)', after?.stock === 99, 'stock: ' + after?.stock);

    const cash = await api('/business/cash/today', { token, bizId: mainBizId });
    const entries = Number(cash.body?.data?.totals?.entries ?? cash.body?.data?.entries ?? NaN);
    check('CAISSE : 15000 entres dans la caisse du jour', entries >= 15000, 'entries: ' + entries);

    const closeRes = await api('/business/cash/close', { method: 'POST', token, bizId: mainBizId, body: { actualBalance: 15000 } });
    check('Cloture de la caisse OK', closeRes.status === 200 || closeRes.status === 201, 'status: ' + closeRes.status);
  }

  // GARANTIE 3 : multi-business + score
  const secondBiz = await api('/business/onboarding', {
    method: 'POST', token,
    body: {
      name: 'Service Integrite ' + uniq,
      type: 'INSTITUT_ESTHETIQUE',
      shortDescription: 'Business de services',
      phone: '+2250708091011',
      address: 'Abidjan', city: 'Abidjan', country: 'CI',
      modules: ['SERVICES', 'BOOKINGS', 'PROMOTIONS', 'PLANNING'],
      slug: 'service-integrite-' + uniq,
    },
  });
  const secondBizId = secondBiz.body?.data?.id || secondBiz.body?.data?.business?.id;
  check('2e business (services) cree — multi-activite', !!secondBizId, JSON.stringify(secondBiz.body).slice(0, 200));

  if (secondBizId) {
    await api('/business/' + secondBizId + '/services', {
      method: 'POST', token,
      body: { name: 'Consultation', price: 5000, durationMinutes: 30 },
    }).catch(() => ({}));
    const scoreMe = await api('/afriscore/mine', { token }).catch(() => ({ status: 0, body: null }));
    check('Score accessible sans erreur', scoreMe.status === 200 || scoreMe.status === 201, 'status: ' + scoreMe.status);
  }

  // GARANTIE 5 : DEMO PAIEMENT
  const demoInit = await api('/payments/processor/initiate', {
    method: 'POST', token,
    body: { provider: 'DEMO', amount: 25000, currency: 'FCFA' },
  });
  const demoStatus = demoInit.body?.data?.status;
  const demoRef = demoInit.body?.data?.providerRef;
  check('DEMO : initiation -> PENDING', demoStatus === 'PENDING', 'status: ' + demoStatus);
  check('DEMO : ref sim_ generee', typeof demoRef === 'string' && demoRef.startsWith('sim_'), 'ref: ' + demoRef);

  if (demoRef) {
    const demoConfirm = await api('/payments/processor/demo/confirm', {
      method: 'POST', token, body: { providerRef: demoRef },
    });
    const confirmed = demoConfirm.body?.data?.status;
    check('DEMO : confirmation -> SUCCESS (webhook simule)', confirmed === 'SUCCESS', JSON.stringify(demoConfirm.body).slice(0, 200));
    const again = await api('/payments/processor/demo/confirm', { method: 'POST', token, body: { providerRef: demoRef } });
    check('DEMO : idempotence (2e confirmation refusee)', again.body?.data?.alreadyConfirmed === true);
  }

  const fakeRef = await api('/payments/processor/demo/confirm', { method: 'POST', token, body: { providerRef: 'TXN_REAL_123' } });
  check('DEMO : ref non sim_ refusee (403)', fakeRef.status === 403, 'status: ' + fakeRef.status);

  console.log('\n==== RESULTAT : ' + pass + ' OK / ' + fail + ' FAIL ====');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Test crash:', e); process.exit(1); });
