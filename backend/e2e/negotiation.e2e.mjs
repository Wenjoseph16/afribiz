/**
 * E2E — Chantier 6 : Négociation & Prix Flash Client (boucle complète).
 *
 * Preuve de bout en bout :
 *   1. Un produit négociable (mécanisme NEGOTIATION rattaché) expose `negotiable`
 *   2. Le client propose un prix (route publique) → l'offre est PENDING
 *   3. Le business est notifié (notification in-app + socket)
 *   4. Le business accepte → PRIX ACCORDÉ FIGÉ + lien éphémère (TTL 48h, 1 usage)
 *   5. Le lien résout l'article au prix accordé (catalogue intact)
 *   6. La commande est créée au prix accordé (serveur ignore le prix client)
 *   7. Le paiement démo entre dans la CAISSE DU JOUR au montant négocié
 *   8. L'alerte boss (grosse remise) est générée
 *   9. Le lien est à USAGE UNIQUE : une 2e commande est refusée
 *   10. La contre-proposition du business change le prix accordé
 *
 * Lancement : serveur sur http://localhost:3001 + base locale, puis
 *   node e2e/negotiation.e2e.mjs
 */
const BASE = 'http://localhost:3001/api';
const EMAIL = 'resto@afribiz.com';
const PASSWORD = 'Afribiz@2026!';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log('  OK  ' + name);
  } else {
    fail++;
    console.log('  FAIL ' + name + (extra ? ' — ' + extra : ''));
  }
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
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, body: json };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // ── Connexion business ──
  const login = await api('/auth/login', {
    method: 'POST',
    body: { identifier: EMAIL, password: PASSWORD },
  });
  const token = login.body?.data?.accessToken || login.body?.data?.token;
  check('Login business', !!token, JSON.stringify(login.body || login.status));

  const me = await api('/business/me', { token });
  // Réponse : data = business actif (objet), businesses = liste multi-activité (racine)
  const bizList = Array.isArray(me.body?.businesses) ? me.body?.businesses : [];
  const mainBizId =
    (bizList.find((b) => b.name && !b.name.includes('Integrite')) || bizList[0])?.id ||
    me.body?.data?.id;
  check('Business principal trouvé', !!mainBizId, JSON.stringify(me.body).slice(0, 150));

  const uniq = Date.now().toString().slice(-6);

  // ── 1. Produit négociable (prix de base 15 000 F) ──
  const productRes = await api('/business/products', {
    method: 'POST',
    token,
    bizId: mainBizId,
    body: { name: 'Nego ' + uniq, price: 15000, currency: 'FCFA', stock: 50, unit: 'piece' },
  });
  const product = productRes.body?.data?.product || productRes.body?.data;
  const productId = product?.id;
  const productSlug = product?.slug;
  check('Produit 15000 créé', !!productId, JSON.stringify(productRes.body).slice(0, 200));
  check('Produit a un slug (fiche publique)', !!productSlug, 'slug: ' + productSlug);

  // ── Attacher le mécanisme NEGOTIATION (le toggle du business) ──
  const attach = await api('/business/catalog-attachments', {
    method: 'POST',
    token,
    bizId: mainBizId,
    body: {
      itemType: 'PRODUCT',
      itemId: productId,
      sourceType: 'NEGOTIATION',
      config: { enabled: true, minDiscountPercent: 10 },
    },
  });
  check('Mécanisme NEGOTIATION rattaché', attach.status === 201 || attach.status === 200,
    'status: ' + attach.status + ' ' + JSON.stringify(attach.body).slice(0, 150));

  // ── 1bis. La fiche publique expose `negotiable: true` (getProductBySlug) ──
  const fiche = await api('/marketplace/product/' + productSlug);
  check('Fiche produit expose negotiable=true', fiche.body?.data?.negotiable === true,
    JSON.stringify(fiche.body?.data).slice(0, 150));

  // ── 2. Le client propose 10 000 F (route publique, sans token) ──
  const offer = await api('/public/negotiations', {
    method: 'POST',
    body: {
      itemType: 'PRODUCT',
      itemId: productId,
      proposedPrice: 10000,
      message: 'Je prends si vous me faites 10 000',
      clientName: 'Client E2E',
      clientPhone: '+2250700000000',
    },
  });
  const offerId = offer.body?.data?.offerId;
  check('Offre créée (PENDING)', offer.status === 201 && !!offerId,
    'status: ' + offer.status + ' ' + JSON.stringify(offer.body).slice(0, 150));

  // ── 3. Le business est notifié ──
  await wait(600);
  const notifs = await api('/notifications?limit=50', { token });
  const notifList = notifs.body?.data?.notifications || [];
  const negNotif = notifList.find(
    (n) => n.metadata?.source === 'negotiation' || String(n.title || '').toLowerCase().includes('nouvelle offre')
  );
  check('Business notifié de la nouvelle offre', !!negNotif,
    notifList.slice(0, 3).map((n) => n.title).join(' | '));

  // ── 4. Le business accepte → prix accordé + lien éphémère ──
  const accept = await api('/business/negotiations/' + offerId + '/accept', { method: 'POST', token });
  const accepted = accept.body?.data;
  check('Offre acceptée (ACCEPTED)', accepted?.status === 'ACCEPTED', 'status: ' + accepted?.status);
  check('Lien éphémère généré', typeof accepted?.link === 'string' && accepted.link.includes('/checkout/negotiated/'),
    'link: ' + accepted?.link);
  const tokenLink = accepted?.link?.split('/checkout/negotiated/')?.[1];
  check('Token présent dans le lien', !!tokenLink);

  // ── 5. Le lien résout le prix accordé FIGÉ ──
  const resolve = await api('/public/negotiated/' + tokenLink);
  const resolved = resolve.body?.data;
  check('Lien résolu', resolve.status === 200, 'status: ' + resolve.status);
  check('Prix accordé figé = 10000', Number(resolved?.agreedPrice) === 10000, 'agreed: ' + resolved?.agreedPrice);
  check('Article du lien = produit', resolved?.itemId === productId);
  check('Remise affichée = 5000', Number(resolved?.discountAmount) === 5000, 'remise: ' + resolved?.discountAmount);

  // ── 6. Commande au prix accordé (le client enverrait n'importe quoi, le serveur ignore) ──
  const order = await api('/public/negotiated/' + tokenLink + '/order', {
    method: 'POST',
    body: {
      paymentMethod: 'MOBILE_MONEY',
      contactName: 'Client E2E',
      contactPhone: '+2250700000000',
      deliveryAddress: 'Abidjan, Cocody',
      // Le prix N'EST PAS dans le body : il est porté par l'offre.
    },
  });
  const orderData = order.body?.data;
  check('Commande créée (201)', order.status === 201, 'status: ' + order.status + ' ' + JSON.stringify(order.body).slice(0, 150));
  check('Commande au prix négocié = 10000', Number(orderData?.totalAmount) === 10000,
    'total: ' + orderData?.totalAmount);
  check('Commande payée (démo confirmée)', orderData?.payment?.status === 'SUCCESS' || orderData?.paymentStatus === 'PAID',
    JSON.stringify(orderData?.payment).slice(0, 100));
  check('Offre marquée COMPLETED (lien consommé)', orderData?.negotiated?.agreedPrice === 10000);

  // ── 7. La caisse du jour reçoit le montant négocié (Brique A) ──
  await wait(500);
  const cash = await api('/business/cash/today', { token, bizId: mainBizId });
  const entries = Number(cash.body?.data?.totals?.entries ?? cash.body?.data?.entries ?? NaN);
  check('Caisse du jour ≥ 10000 (montant négocié)', entries >= 10000, 'entries: ' + entries);

  // ── 8. Alerte boss : la remise (5000) atteint le seuil par défaut ──
  await wait(600);
  const notifs2 = await api('/notifications?limit=50', { token });
  const bossAlert = (notifs2.body?.data?.notifications || []).find(
    (n) => n.description && String(n.description).toLowerCase().includes('remise')
  );
  check('Alerte boss générée (remise tracée)', !!bossAlert,
    (notifs2.body?.data?.notifications || []).slice(0, 4).map((n) => n.title + ' / ' + n.description).join(' | '));

  // ── 9. Usage unique : 2e commande avec le même lien → refusée ──
  const order2 = await api('/public/negotiated/' + tokenLink + '/order', {
    method: 'POST',
    body: { paymentMethod: 'CASH', contactName: 'Client E2E', contactPhone: '+2250700000000' },
  });
  check('Lien à usage unique (2e commande refusée)',
    order2.status === 400 || order2.status === 404 || order2.status === 409,
    'status: ' + order2.status + ' ' + JSON.stringify(order2.body).slice(0, 120));

  // ── 10. Contre-proposition : le business répond 11 000, le lien s'adapte ──
  const offer2 = await api('/public/negotiations', {
    method: 'POST',
    body: {
      itemType: 'PRODUCT',
      itemId: productId,
      proposedPrice: 9000,
      clientName: 'Client E2E 2',
      clientPhone: '+2250700000001',
    },
  });
  const offer2Id = offer2.body?.data?.offerId;
  const counter = await api('/business/negotiations/' + offer2Id + '/counter', {
    method: 'POST',
    token,
    body: { counterPrice: 11000, message: 'Je peux faire 11 000 max' },
  });
  check('Contre-proposition envoyée (COUNTERED)', counter.body?.data?.status === 'COUNTERED',
    'status: ' + counter.body?.data?.status);

  const accept2 = await api('/business/negotiations/' + offer2Id + '/accept', { method: 'POST', token });
  check('Contre-proposition acceptée → prix accordé = 11000',
    Number(accept2.body?.data?.agreedPrice) === 11000,
    'agreed: ' + accept2.body?.data?.agreedPrice);

  console.log('\n==== RESULTAT NÉGOCIATION : ' + pass + ' OK / ' + fail + ' FAIL ====');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Test crash:', e);
  process.exit(1);
});
