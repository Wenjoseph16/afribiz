# 🏗️ AFRIBIZ — DOCUMENT DE REPRISE OFFICIEL (état au 20 août 2026)

> **Ce document est le point de reprise unique.** Chaque nouvelle conversation commence par le lire.
> Il contient : l'état du projet, la méthode de travail, les skills, et le chantier suivant.

---

## 0. ⚡ RÈGLE ABSOLUE DE REPRISE

**Avant de coder quoi que ce soit, tu dois :**
1. **Lire CE FICHIER en entier** — c'est ta mémoire
2. **Charger les skills** (voir §6) — `skill("nodejs-backend-patterns")`, `skill("nextjs-app-router-patterns")`, etc.
3. **Explorer le code existant** — ne jamais supposer, toujours vérifier avec `code_search`, `read_files`, `glob`
4. **Maîtriser le contexte du chantier** — comprendre les dépendances, les fichiers impactés, les patterns existants
5. **Poser le plan** — `write_todos` avec TOUTES les étapes, y compris TSC, tests, review, commit
6. **Exécuter dans l'ordre** — un chantier à la fois, finir avant de passer au suivant

---

## 1. 🎯 LA VISION

Le cahier du gérant, digitalisé et infaillible : une action au comptoir → une trace → tout converge
(caisse, stock, dette, alerte boss). Le gérant travaille en 2 clics, le boss pilote à distance en temps
réel, et le catalogue « respire » (promo, épargne, négociation, groupement… rattachés par le business
lui-même, partout où il veut).

**Stack** : monorepo (backend Express + Prisma/PostgreSQL · frontend Next.js App Router + Tailwind ·
shared). Mobile-first, réalité africaine (Mobile Money, WhatsApp, offline, FCFA).

---

## 2. ✅ CE QUI EST LIVRÉ ET COMMITTÉ

| # | Chantier | Commit | Description |
|---|----------|--------|-------------|
| — | Pilier 1 : POS | `870afeb` | Vente, remise, crédit, paiements, reçu WhatsApp |
| — | Pilier 2 : Carnet intelligent | `75c0a67` | Dettes, rappels auto, encaissement |
| — | Pilier 3 : Copilote | `7cc3d8f` | Brief du matin : CA hier, créances, stock faible, livraisons |
| 1 | FormKit | `37edd34` + `09bf095` | Socle formulaires + checkout intelligent (livraison/retrait) + formulaire produit |
| 2 | Socle de rattachement | 6 commits (voir §2.1) | PriceEngine + CatalogAttachment + 34 mécanismes rattachables + calcul réel |
| 3 | Offline-First | `9d96fc1` | PWA + Service Worker + file de sync IndexedDB |
| 4 | Caisse journalière | `f78d833` | CashSession : ouverture → mouvements → clôture (Brique A) |
| 5 | Contrôle Boss | `0c52622` | Fix multi-business + alerte grosse remise + cockpit (Brique B) |
| 5.5 | Intégrité des calculs | `c4246fe` | Anti-triche + AfriScore corrigé + paiement démo + test 14/14 |
| **6** | **Négociation & Prix Flash** | **`c873281`** | **Boucle complète : offre → lien éphémère → paiement → caisse → alerte boss** |
| **7** | **Rôles & permissions** | **`ae5a2bc`** | **RBAC employés : login PIN + permissions + audit trail** |
| **8** | **Inventaire Express 📸** | **`86411fb`** | **5 modes d'entrée : CSV (PapaParse) + barcode (BarcodeDetector) + voix (Web Speech) + lots (Repeater) + photo (~800px, pHash)** |
| **9** | **Offline-First étendu** | **`ed5089c`** | **Cache catalogue local + cache négociation + conflits horodatage + retry exponentiel** |
| **10** | **Affiliation** | **`d489f27`** | **Dashboard affiliation + partage WhatsApp + commission récurrente** |
| **V1** | **Notifications live** | **`03ac8cc`** | **Toast feedback + polling notifications + LiveIndicator + OrderTimeline** |
| **V2** | **Refonte UI 2027 — Cart/Checkout/Dashboard** | **`b63b78c`** | **Glass premium, double-bezel, framer-motion, bento layout** |
| **V3** | **Réservations dynamiques** | **`ab805e2`** | **SlotPicker créneaux + step flow 4 étapes + paiement acompte inline** |
| **V4** | **Abonnements + Locations glass** | **`13191b3`** | **Glass premium subscriptions + rentals list** |
| **Fix** | **Dashboard invisible** | **`56898ed`** | **Glass CSS class + dark background #0a0f1a** |
| **V5** | **Polish UI** | **`584a24b`** | **Loading skeletons + glass-hover + micro-interactions + scroll-fade-in** |
| **V6** | **Onboarding Business** | **`6f3e427`** | **Refonte 5 étapes : identité → compétences → portfolio → localisation → modules + preview live + succès QR** |
| **V6-fix** | **Onboarding bugs** | **`137206e`** + **`a1089d9`** | **Upload File direct + 5 bugs fixes (submit mapping, modules valides, GPS, upload feedback, certificats)** |
| **V7** | **Page publique données** | **`e245265`** + **`a65e514`** | **Backend sauvegarde openingHours + portfolio + seed complet Saveur d'Abidjan** |
| **V8** | **Page publique premium** | **`43d14df`** + **`434f596`** + **`9ec335e`** | **Design premium 2027 : Banner cinematic, Accueil double-bezel, Products bento, Portfolio masonry+lightbox, Footer editorial, Nav dynamique, fix clé doublée** |

### Chantier 2 en détail (6 commits)
- `26fd16e` — Étape A : PriceEngine + résolveur `GET /catalog/attachments` + table `CatalogAttachment`
- `23509da` — Étape B : achat groupé multi-types + enum promotion += `TRAINING`/`RENTAL`
- `e1afc64` — Étape C : 12 mécanismes à calcul réel (taxe, quantités, dispo, perso, cadeau, créneau, croisées, urgence)
- `a8932a2` — ScopePicker branché dans promo + épargne (ciblage ENTREPRISE / CATÉGORIE / ARTICLES PRÉCIS)
- `ad34c22` — Étape E : mécanismes 2027 (12 nouveaux rattachables)
- `4a62afa` + `ec2288e` — Étape F : affiliation + contenu shoppable (stories/shorts/lives)

### Chantier 6 en détail (négociation)
- Modèle `NegotiationOffer` déployé en base ✅
- Service 622 lignes (proposer/accepter/contre-proposer/refuser/resolveToken/createNegotiatedOrder) ✅
- 8 routes montées dans server.ts ✅
- API frontend (methods + types + injection) ✅
- Bouton 🤝 client `NegotiationButton.tsx` ✅
- La boucle : offre → lien éphémère (TTL 48h, usage unique, prix figé) → commande → caisse du jour → alerte boss ✅

### Chantier 7 en détail (rôles)
- RBAC employés : login par PIN (champ dédié) ✅
- Permissions par rôle (BOSS, GERANT, CAISSIER, VENDEUR, EMPLOYE) + middleware backend ✅
- Audit trail : chaque action signée (userId, timestamp, action) ✅
- Masquage frontend selon le rôle ✅

### Chantier 9 en détail (offline-First étendu)
- `catalogCache.ts` : cache catalogue local (produits + catégories en IndexedDB) ✅
- `negotiationCache.ts` : cache négociation hors-ligne + actions offline ✅
- `conflictResolver.ts` : résolution de conflits par horodatage ✅
- `retryStrategy.ts` : retry exponentiel (5s → 30min, max 5 retries) ✅
- `offlineCatalog.ts` : React hooks pour catalogue + statut offline ✅
- `offlineSyncService.ts` : 3 nouvelles actions backend ✅
- TSC BE + FE 0 erreur ✅

### Chantier 10 en détail (affiliation)
- Dashboard affiliation : stats (clics, commandes, gains, taux conversion) ✅
- Liste liens avec copier/partager/supprimer ✅
- Bouton partage WhatsApp `AffiliateShareButton.tsx` ✅
- Commission récurrente sur chaque commande payée ✅
- TSC BE + FE 0 erreur ✅

### Refonte UI 2027 (V1-V8)
- **V1** — Notifications live : `useNotificationPolling` (auto-refresh 30s) + toast sur actions clés + `LiveIndicator` + `OrderTimeline` ✅
- **V2** — Glass premium : Cart/Checkout/Dashboard refonte avec `bg-white/[0.03]` → CSS `.glass` + double-bezel + framer-motion ✅
- **V3** — Réservations dynamiques : `SlotPicker` (créneaux par date) + step flow 4 étapes + paiement acompte inline ✅
- **V4** — Abonnements/Locations : glass premium list + grid cards ✅
- **Fix** — Dashboard invisible : fond dark `#0a0f1a` + glass CSS class + noise overlay réduit ✅
- **V5** — Polish : `DashboardSkeleton`/`BookingsSkeleton` (shimmer) + `glass-hover` CSS + `scroll-fade-in` ✅
- **V6** — Onboarding Business : 5 étapes (Identité → Compétences → Portfolio → Localisation → Modules) + preview live page publique + écran succès QR code ✅
- **V6-fix** — Onboarding bugs : upload File direct (pas FormData) + submit mapping (typeId→type) + 22 modules valides + GPS feedback + certificat display ✅
- **V7** — Page publique données : backend `createBusiness` sauvegarde `openingHours` (BusinessHour) + `portfolio` (PortfolioItem) + nav dynamique par modules cochés + stories max 3 ✅
- **V8** — Page publique premium : Banner cinematic gradient + Accueil double-bezel + Products asymmetrical bento + Portfolio masonry+lightbox + Sidebar glass + Nav floating pill + Footer editorial ✅
- **Tests** : 279 fichiers de tests backend ✅
- **TSC** : BE + FE 0 erreur sur tous les chantiers ✅

### Chantier 8 en détail (inventaire express)
- Import CSV : vrai parsing PapaParse + preview validation + backend `POST /products/import` ✅
- BarcodeScanner : `BarcodeDetector` natif + route `GET /products/barcode/:code` (lookup base partagée) ✅
- VoiceInput : Web Speech API natif (fr-FR) + Enter valide ✅
- Mode lots : page `/products/express` avec Repeater + catégories + « Tout enregistrer » ✅
- PhotoReference : compression ~800px, anti-doublon pHash, grille photos au POS ✅
- TSC BE + FE 0 erreur ✅
- Dépendance : `papaparse` + `@types/papaparse` ✅

### Onboarding Business en détail (V6 + V6-fix)
- **Étape 1 — Identité** : name, typeId, description, logo upload, bannière upload ✅
- **Étape 2 — Compétences** : multi-tags (3-10) + suggestions par catégorie, textarea 500, select années, certificats upload ✅
- **Étape 3 — Portfolio** : galerie projets (titre, desc, photo upload, lien) ✅
- **Étape 4 — Localisation** : pays prioritaire Afrique, région, ville, quartier, adresse, GPS auto, WhatsApp toggle, horaires toggle jour par jour ✅
- **Étape 5 — Modules** : 22 modules toggleables avec icônes, couleurs, descriptions ✅
- **Preview live** : page publique qui se construit en temps réel ✅
- **Écran succès** : QR code + lien copiable + partage WhatsApp ✅
- **Backend** : `createBusiness` sauvegarde `openingHours` (BusinessHour) + `portfolio` (PortfolioItem) + skills ✅
- **Fix upload** : passer File directement (pas FormData) ✅
- **Fix submit** : transformation champs (typeId→type, description→shortDescription, etc.) ✅
- **Fix modules** : uniquement les `BusinessModule` valides de l'enum ✅

### Page publique en détail (V7 + V8)
- **Banner** : cinematic gradient overlay + KenBurn animation + badges glass pill ✅
- **Accueil** : eyebrow tags, stat cards double-bezel, manager card gradient, skills/certs badges ✅
- **Nav interne** : floating pill design, filtre par modules cochés (pas static) ✅
- **Products** : asymmetrical bento, premier item hero 2 cols, double-bezel cards ✅
- **Portfolio** : masonry alternée, hover gradient slide-up, lightbox plein écran ✅
- **Sidebar** : glass cards, section titles avec icon boxes, pulse animation ✅
- **Footer** : editorial dark, newsletter glass card, colonnes minimales ✅
- **Stories/Shorts** : max 3 visibles + badge KYC + lien "Voir tout" ✅
- **Seed** : Saveur d'Abidjan complet (6 skills, 2 certs, 7 ans, 7 jours horaires, 13 modules, 3 portfolio) ✅

---

## 3. 🧮 LES GARANTIES D'INTÉGRITÉ (Chantier 5.5 — ne pas casser)

**Anti-triche** : `createOrder` recalcule chaque ligne via PriceEngine — le prix envoyé par le client est
**toujours ignoré**. Test prouvé : 1 F envoyé → 15 000 F facturé. Stock décrémenté uniquement dans le
business propriétaire.

**AfriScore** : pondération exacte 30/25/15/15 (4 scores), `totalRevenue` calculé réellement, score
multi-type (services/chambres), temps de réponse par conversation réelle.

**Caisse** : sessions filtrées par jour calendaire + clôture auto des sessions périmées +
`recordOrderSale` ne peut plus échouer en silence.

**Paiement démo** : cycle `DEMO` → PENDING → « J'ai confirmé » → webhook simulé → SUCCESS.
Idempotence (2e confirmation refusée) + fausses refs refusées (403).

---

## 4. 📐 LE CHANTIER SUIVANT : 11 — TRAÇABILITÉ / LOT / PÉREMPTION

### État des tests (20 août 2026)
- **279 fichiers de tests backend** couvrant : auth, orders, business, groupBuy, paymentProcessor, employeeAuth, offlineSync, affiliation, afriScore, advancedTasks, live, story, short, room, copilot, search, upload, imageProcessing, rateLimiter, correlationId, validators, socket, disputes, wallet, presenceService, platformSettings, etc.
- **28 tests frontend** (Chantiers 8, 9, 10, V1, V4)
- **Tests exécutés avant chaque commit** selon la méthode de travail (§7)
- **Aucun test spécifique onboarding/page publique** — à ajouter dans le prochain chantier

### Ce qui a été validé en production (test utilisateur)
- ✅ Onboarding 5 étapes : identité, compétences, portfolio, localisation, modules
- ✅ Upload photos (logo, bannière, portfolio, certificats)
- ✅ GPS géolocalisation
- ✅ Soumission création business
- ✅ Page publique Saveur d'Abidjan : horaires, compétences, portfolio, modules, stories
- ✅ Login joseph@gmail.com + josh@gmail.com (Test1234!)
- ⚠️ Bug clé doublée InternalNav corrigé (`9ec335e`)
- ⚠️ Seed purgé les comptes existants → restaurés

### Objectif
Gestion des lots, dates de péremption, alerts de péremption, traçabilité complète du stock.

### Ce qui existe déjà
- Modèle `Product` avec champ `batchNumber` potentiel
- Service `product.ts` avec CRUD complet
- Caisse journalière (CashSession) avec `recordOrderSale`

### Ce qu'il reste à faire
1. **Modèle Lot** : `Batch` avec `productId`, `quantity`, `expiryDate`, `supplier`
2. **Alertes péremption** : notification auto N jours avant expiry
3. **Décrément lot** : FIFO (prestentré, première sortie) sur les ventes
4. **Dashboard lots** : vue par produit avec dates de péremption
5. **Export traçabilité** : QR code par lot, historique mouvements

### Points d'ancrage dans le code
- `backend/src/services/product.ts` — CRUD produits
- `backend/src/services/cashService.ts` — encaissements
- `frontend/src/app/(dashboard)/dashboard/products/` — pages produits

---

## 5. 📋 CHANTIERS APRÈS LE 11

| # | Chantier | Objectif |
|---|----------|----------|
| 11 | Traçabilité / lot / péremption | Gestion des lots, dates de péremption, alerts de péremption |
| 12 | Stock multi-dépôts | Répartition dans plusieurs boutiques/dépôts |
| 13 | **QA globale** | Test complet avec `webapp-testing` (Playwright) — l'utilisateur a trouvé des bugs partout |
| 14 | Espace client final | Parcours client complet : marketplace → panier → checkout → suivi → avis |

---

## 6. 🧠 LES SKILLS (à charger au début de chaque session)

### Skills OBLIGATOIRES (charger systématiquement)

| Skill | Usage |
|-------|-------|
| `nodejs-backend-patterns` | Tout code backend (services, routes, middleware, contrôleurs) |
| `nextjs-app-router-patterns` | Tout code frontend Next.js (pages App Router, Server Components, API routes) |
| `webapp-testing` | Tests navigateur Playwright (QA, parcours client, reproduction de bugs) |
| `tdd` | Écrire les tests avant/avec le code (standard des chantiers) |
| `systematic-debugging` | Tout bug / test qui échoue (ne JAMAIS deviner, toujours tracer la cause racine) |
| `high-end-visual-design` | Toute UI : bannir Inter/Roboto, grilles 3 cartes, ombres grises, `linear`/`ease-in-out`. Utiliser double-bezel, espacement `py-24+`, cubic-bezier custom, mobile-first |

### Skills CONTEXTUELS (selon besoin)

| Skill | Usage |
|-------|-------|
| `frontend-design` / `ui-ux-pro-max` | Direction visuelle, composants, palette, typographie |
| `apple-design` | Si on fait des micro-interactions spring/physique |
| `request-refactor-plan` | Refactorisations majeures (commits ultra-fins réversibles) |
| `design-taste-frontend` | Anti-slop frontend, designs premium non-templated |
| `improve-codebase-architecture` | Audit d'architecture, opportunités de deepening |

### Comment les charger
```typescript
skill("nodejs-backend-patterns")
skill("nextjs-app-router-patterns")
skill("tdd")
skill("systematic-debugging")
skill("high-end-visual-design")
// + skills contextuels selon le chantier
```

---

## 7. 🏭 NOTRE MÉTHODE DE TRAVAIL (Version 2027)

### La règle d'or : un chantier = fini avant de passer au suivant

```
Chantier N → Plan → Code → TSC (0 erreur) → Tests → Review → Commit → Chantier N+1
```

**JAMAIS :**
- Commencer un chantier avant d'avoir fini le précédent
- Pusher sans TSC clean
- `git add .` (toujours stage fichiers par fichiers du chantier)
- Supposer qu'un code existant marche sans le vérifier
- Deviner la cause d'un bug (toujours tracer avec `systematic-debugging`)

### L'ordre de travail par chantier

```
1. AUDIT du code existant
   → glob + code_search + read_files pour comprendre l'état réel
   → ne jamais supposer, toujours lire

2. PLAN complet (write_todos)
   → TOUTES les étapes, y compris TSC, tests, review, commit
   → un todo par fichier à créer/modifier
   → un todo de validation (TSC + tests + commit)

3. EXÉCUTION dans l'ordre
   → backend d'abord (modèles → services → routes → controllers)
   → frontend ensuite (API client → composants → pages)
   → branchement (connecter backend + frontend)

4. VALIDATION
   → TSC backend : cd backend && npx tsc --noEmit --pretty false
   → TSC frontend : cd frontend && npx tsc --noEmit --pretty false
   → Tests API (curl ou script node)
   → Tests navigateur (webapp-testing si UI)

5. REVIEW (code-reviewer-deepseek-flash)
   → relire les changements
   → vérifier les failles de sécurité
   → vérifier la cohérence avec les patterns existants

6. COMMIT (propres, sans reliquats)
   → git status (vérifier qu'on stage que les bons fichiers)
   → git log --oneline (vérifier le style de message)
   → commit message descriptif avec tag (feat(chantier-X): ...)
```

### L'ingénierie 2027 : penser au-delà du code

Pour chaque feature, se poser ces 5 questions :
1. **Le calcul est-il réel ?** (pas décoratif — le montant doit être correct)
2. **Le business contrôle-t-il ?** (c'est lui qui active/désactive, pas nous)
3. **Ça marche hors-ligne ?** (si c'est au comptoir, le réseau peut tomber)
4. **Le boss voit-il ?** (tracé complet, alertes, audit trail)
5. **Le client est-il fluidifié ?** (zéro friction, 2 clics max)

### Architecture : toujours réutiliser, jamais réécrire

```
Nouveau feature → chercher ce qui existe déjà
  → PriceEngine ? → oui → l'utiliser
  → CatalogAttachment ? → oui → ajouter un sourceType
  → Notification ? → oui → prisma.notification.create
  → CashSession ? → oui → recordOrderSale
  → Rien n'existe ? → construire un nouveau module, mais réutiliser les helpers existants
```

---

## 8. 🗂️ ARCHITECTURE — LES FICHIERS CLÉS

### Backend (backend/src/)
| Fichier | Rôle |
|---------|------|
| `services/priceEngine.ts` | LE moteur de prix unique (tous les mécanismes, priorité, anti-triche) |
| `services/catalogAttachmentService.ts` | Socle de rattachement unifié |
| `services/cashService.ts` | Caisse journalière (CashSession, recordOrderSale, clôture) |
| `services/negotiationService.ts` | Négociation (Chantier 6) : offre → lien → commande → caisse |
| `services/orders.ts` | createOrder anti-triche (recalcule via PriceEngine) |
| `services/bossCockpitService.ts` + `dashboardService.ts` | Cockpit boss |
| `services/paymentProcessor.ts` | Paiements (provider DEMO inclus) |
| `controllers/paymentDemoController.ts` | Démo paiement sans clé FedaPay |
| `services/NotificationChannels.ts` | WhatsApp / SMS / email |
| `services/product.ts` | CRUD produits + `lookupBarcodeByCode` (Chantier 8) |
| `routes/` | Un fichier par domaine + `routes/index.ts` + montage dans `server.ts` |

### Frontend (frontend/src/)
| Fichier | Rôle |
|---------|------|
| `components/formkit/` | Socle formulaires (ScopePicker, MoneyInput, ImageDropzone, VoiceInput, BarcodeScanner, PhotoReference…) |
| `components/negotiation/` | Bouton 🤝 client |
| `components/business-public/` | Page publique : Banner, Accueil, InternalNav, Footer, Sidebar, Products, Portfolio, MediaStories, MediaShorts |
| `features/onboarding/` | Onboarding wizard 5 étapes : StepIdentity, StepExpertise, StepPortfolio, StepLocation, StepModules + OnboardingWizard + OnboardingSuccess |
| `services/api/` | Un module par domaine → injecté dans `apiClient.ts` |
| `app/(public)/business/[slug]/` | Page publique dynamique par business |
| `app/(dashboard)/dashboard/products/express/` | Inventaire express (Chantier 8) — mode lots, scan, voix |
| `app/(dashboard)/` | Dashboard business (cockpit, pages par module) |

### Base de données
- `backend/prisma/schema.prisma` — schéma concaténé
- `backend/prisma/models/*.prisma` — modèles par domaine
- Migrations manuelles dans `prisma/migrations/`
- ⚠️ La base a un historique de migrations `failed` → pattern de récupération : marquer `_prisma_migrations` comme `applied`

---

## 9. ⚠️ POINTS D'ATTENTION

1. **252 fichiers non commités** : reliquats historiques. **JAMAIS `git add .`** — stage uniquement les fichiers du chantier en cours
2. **FedaPay** : pas de clé API → la démo paiement (`DEMO`) est le chemin par défaut
3. **RAM Freebuff** : une conversation par chantier, coller ce document en ouverture
4. **Le cockpit ≠ nouvelle page** : le dashboard est transformé en cockpit (centre les infos), toutes les autres fonctionnalités restent dans leurs menus
5. **AfriScore** : corrigé dans le 5.5. Ne plus toucher sans test de preuve
6. **Bugs signalés par l'utilisateur** : test client trouvé des bugs « partout » → passe QA globale nécessaire (Chantier 13)
7. **Seed = reset** : `npx tsx prisma/seedRealistic.ts` réécrit TOUS les comptes business. Ne lancer qu'en dev.
8. **Comptes de test** : `joseph@gmail.com` / `josh@gmail.com` (Test1234!) — vérifier après chaque seed.
9. **Page publique lit `business.skills`** (pas `business.owner.skills`). L'onboarding doit sauver au bon endroit.
10. **Upload = File direct** : `apiClient.uploadMedia(file)` PAS `uploadMedia(formData)`. Le client crée son propre FormData.

---

## 10. 🔁 BLOC DE REPRISE (à coller dans une nouvelle conversation)

```
Lis docs/REPRISE_CHANTIERS.md en entier (le document de reprise officiel du projet AfriBiz).

Charge les skills OBLIGATOIRES :
- skill("nodejs-backend-patterns")
- skill("nextjs-app-router-patterns")
- skill("tdd")
- skill("systematic-debugging")
- skill("high-end-visual-design")

Avant de coder quoi que ce soit, maîtrise le code :
1. Lis les fichiers clés du chantier (voir §8 du document)
2. Vérifie l'état réel avec code_search, read_files, glob
3. Ne suppose JAMAIS, lis TOUJOURS

On commence le Chantier 11 : Traçabilité / lot / péremption
- Objectif : gestion des lots, péremption, traçabilité FIFO
- Vérifier l'existant (product.ts, cashService.ts)
- Ordre : audit → plan → code backend → code frontend → TSC → tests → review → commit
- Standard : TSC BE + FE 0 erreur, tests API, commit propres
- Rappel : 279 fichiers de tests backend existants, 28 tests frontend

GO.
```
