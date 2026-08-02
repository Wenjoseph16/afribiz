# 🏛️ AFRIBIZ — GUIDE MAÎTRE D'INTÉGRATION

> **La référence unique du projet.** Ce document décrit comment AfriBiz doit fonctionner
> comme UNE seule plateforme cohérente : pour chaque action utilisateur, où va la donnée,
> qui est informé, quels compteurs changent, quels dashboards se mettent à jour.
>
> **Règle d'or** : aucune fonctionnalité nouvelle, aucun changement de design — uniquement
> connecter, synchroniser, centraliser, fiabiliser ce qui existe déjà.

---

## SOMMAIRE

1. [Mission & Principes](#1-mission--principes)
2. [L'écosystème existant (le socle)](#2-lécosystème-existant-le-socle)
3. [Méthodologie de travail](#3-méthodologie-de-travail)
4. [Format de documentation obligatoire](#4-format-de-documentation-obligatoire)
5. [Catalogue des 30 workflows](#5-catalogue-des-30-workflows)
6. [Matrice des rôles](#6-matrice-des-rôles)
7. [Relations transverses](#7-relations-transverses)
8. [Trous connus à combler](#8-trous-connus-à-combler)
9. [Services à mutualiser](#9-services-à-mutualiser)
10. [Définition of Done (DoD)](#10-définition-of-done-dod)
11. [Registre d'avancement](#11-registre-davancement)
12. [Annexes](#12-annexes)

---

## 1. Mission & Principes

### Mission
Transformer une collection de pages et de modules en une **plateforme cohérente**.
Supprimer complètement l'effet « site statique » : chaque action doit produire des
conséquences dans tout l'écosystème.

### Interdits absolus
- ❌ Créer de nouvelles fonctionnalités
- ❌ Modifier le design
- ❌ Ajouter de nouvelles pages
- ❌ Changer l'expérience utilisateur
- ❌ Travailler sur une page isolée (toujours sur un **workflow complet**)

### Autorisations
- ✅ Connecter (événements, sockets, webhooks, API)
- ✅ Synchroniser (compteurs, stats, dashboards, temps réel)
- ✅ Centraliser (sources de vérité uniques, services mutualisés)
- ✅ Fiabiliser (recalculs, journalisation, tests)

### Les 10 questions de chaque action
Pour CHAQUE action utilisateur, déterminer :
1. Quelles données changent ?
2. Quels dashboards doivent être mis à jour ?
3. Quelles statistiques changent ?
4. Quelles notifications envoyer ?
5. Quels compteurs modifier ?
6. Quels widgets mettre à jour ?
7. Quelles pages doivent refléter le changement ?
8. Quels modules sont impactés ?
9. Quels rôles sont concernés ?
10. Quelles automatisations lancer ?

---

## 2. L'écosystème existant (le socle)

Le socle est **bien construit** — le problème est le **câblage manquant**, pas l'infrastructure.

| Brique | Fichier | État |
|---|---|---|
| Bus d'événements (154 types) | `backend/src/events/EventBus.ts` | ✅ |
| File de persistance (at-least-once) | `backend/src/events/QueueService.ts` | ✅ |
| Publishers par domaine | `backend/src/events/publishers/*.ts` (auth, commerce, crm, misc, orders, payments) | ✅ |
| Notifications multi-canaux (~150 mappings) | `backend/src/services/NotificationService.ts` | ✅ IN_APP/EMAIL/SMS/WHATSAPP/PUSH + templates + délivrance |
| Handler notifications (écoute tout) | `backend/src/events/handlers/notificationHandler.ts` | ✅ + socket `notification:new` |
| Handler feed | `backend/src/events/handlers/feedHandler.ts` | ⚠️ 6 types seulement |
| Moteur de règles | `backend/src/services/RuleEngineService.ts` | ✅ écoute tout |
| Moteur de campagnes | `backend/src/services/CampaignEngineService.ts` | ✅ écoute tout |
| Fidélité automatique | `backend/src/services/LoyaltyAutomation.ts` | ✅ ORDER_PLACED + PAYMENT_RECEIVED |
| Tâches avancées | `backend/src/services/advancedTasks.ts` | ✅ ORDER_PLACED + BOOKING_CREATED |
| CRON (~22 alertes) | `backend/src/services/CronService.ts` | ✅ rappels, briefs, purges |
| Analytics | `backend/src/services/analyticsService.ts` | ⚠️ tracké dans ~5 services |
| Présence temps réel | `backend/src/services/presenceService.ts` | ✅ compteur connectés + broadcast admin |
| Temps réel admin | `backend/src/services/adminRealtimeService.ts` | ✅ broadcast 30 s |
| Socket.IO | `backend/src/services/socket.ts` | ✅ rooms user/admin/conversation/live |
| Data Hub | `backend/src/services/dataHubAnalytics.ts` + `afriDataHubService.ts` | ✅ stats plateforme + secteurs + tendances |
| Growth Engine | `backend/src/services/growthEngineService.ts` | ✅ briefs matin/soir + insights |
| Copilot | `backend/src/services/businessCopilot.ts` + modules copilot* | ✅ tips, santé, anomalies, saisonnalité, rapports |
| Frontend providers | `frontend/src/components/providers.tsx` | ✅ Theme, Lang, Query, Analytics, Toast, Maintenance |
| Frontend socket | `frontend/src/components/SocketProvider.tsx` | ✅ notification:new, messages |

### Enregistrement des handlers (`backend/src/server.ts`)
`registerNotificationHandlers()` · `registerFeedHandlers()` · `registerAutomationHandlers()`
· `registerLoyaltyAutomation()` · `RuleEngineService.start()` · `CampaignEngineService.start()`
· `startDashboardRealtime(30000)` · `initSocket(httpServer)`

---

## 3. Méthodologie de travail

Pour chaque workflow, la séquence **obligatoire** :

```
1. ANALYSER   → lire le TOME blueprint correspondant + le code existant
2. CARTOGRAPHIER → déclencheur → API → services → DB → événements → notifs → stats → dashboards
3. RAPPORT    → écrire docs/workflows/NN-*.md au format imposé (section 4)
              → attendre validation avant de coder
4. CORRIGER   → câbler uniquement les connexions manquantes (aucune feature)
5. TESTER     → tsc backend + tsc frontend + tests ciblés
6. VALIDER    → review + DoD (section 10)
7. DOCUMENTER → mettre à jour le rapport + PROGRESS.md
8. PASSER AU SUIVANT (uniquement quand le précédent est validé)
```

**Règle** : on ne commence JAMAIS un workflow tant que le précédent n'est pas
entièrement cohérent, synchronisé, testé et validé.

---

## 4. Format de documentation obligatoire

Chaque rapport `docs/workflows/NN-*.md` contient **4 sections** :

### 1. Flux actuel (avant correction)
```
Client
  ↓
Action (ex : Connexion)
  ↓
API (ex : POST /auth/login)
  ↓
Service → DB
```
Ce qui se passe réellement — on voit les maillons manquants.

### 2. Flux corrigé (après correction)
```
Client
  ↓
Action
  ↓
API
  ↓
Publisher (événement)
  ↓
Notifications
  ↓
Historique / Logs
  ↓
Stats / Analytics
  ↓
Dashboards
  ↓
Data Hub
  ↓
Growth Engine
```
Chaque étape indique **ce qui change** (donnée, table, écran, socket).

### 3. Relations créées
Tableau `Source → Cible` avec ✅ (vérifiées dans le code).

### 4. Relations encore absentes
Tableau `Source → Cible` avec ❌ (à traiter plus tard).

**Règles** : aucun nom de fonction dans le flux (parcours de données) · un exemple complet
par workflow · chaque affirmation vérifiée dans le code (✅ = vérifié, ❌ = absent vérifié).

---

## 5. Catalogue des 30 workflows

> Chaque fiche = objectif + déclencheurs + relations à vérifier + fichiers clés.
> Détail complet dans `docs/workflows/NN-*.md` une fois le workflow traité.

| # | Workflow | Objectif central | Statut |
|---|---|---|---|
| 01 | **Auth** | Connexion/inscription → notifs, analytics, logs, dashboard admin | ✅ fait |
| 02 | **Profil Client** | Actions client → CRM, historique, compteurs, reco | ⏳ |
| 03 | **Profil Business** | Création/modif business → onboarding, modules, stats | ⏳ |
| 04 | **Profil Développeur** | Activation dev → modules, commissions, API keys | ⏳ |
| 05 | **Dashboard Admin** | Toutes les actions → stats admin temps réel, alertes | ⏳ |
| 06 | **Produits** | CRUD produit → stock, feed, analytics, webhooks | ⏳ |
| 07 | **Services** | CRUD service → feed, analytics, réservations | ⏳ |
| 08 | **Réservations** | Réservation → notif, tâches, webhooks, analytics | ⏳ |
| 09 | **Commandes** | Commande → stock, CA, CRM, notif, fidélité | ⏳ |
| 10 | **Paiements** | Paiement → escrow, commission, wallet, notif | ⏳ |
| 11 | **Devis** | Devis → conversion facture, CRM, suivi | ⏳ |
| 12 | **Factures** | Facture → comptabilité, paiement, rapports | ⏳ |
| 13 | **Employés** | RH → planning, salaires, rôles, permissions | ⏳ |
| 14 | **Promotions** | Promo → coupons, fidélité, analytics, feed | ⏳ |
| 15 | **Publicités** | Campagne pub → slots, impressions, revenus admin | ⏳ |
| 16 | **Livraisons** | Livraison → statuts, tracking, notifs, stock | ⏳ |
| 17 | **Documents** | Upload doc → signatures, partage, versions | ⏳ |
| 18 | **Partenaires** | Partenaire → commissions, Data Hub, accès | ⏳ |
| 19 | **Événements** | Événement → billets, feed, rappels, notifs | ⏳ |
| 20 | **Portfolio** | Portfolio → interactions, likes, témoignages | ⏳ |
| 21 | **Avis** | Avis → note business, AfriScore, modération | ⏳ |
| 22 | **Notifications** | Toute action → notif multi-canaux, compteur, socket | ⏳ |
| 23 | **Marketplace** | Achat module → installation, commission, API | ⏳ |
| 24 | **Modules** | CRUD module dev → review, publication, stats | ⏳ |
| 25 | **Messages** | Message → chat temps réel, notifs, historique | ⏳ |
| 26 | **Statistiques** | Agréger → dashboards, analytics, temps réel | ⏳ |
| 27 | **Rapports** | Rapports → export, planification, livraison | ⏳ |
| 28 | **Data Hub** | Données marché → partenaires, tendances, revenus | ⏳ |
| 29 | **Paramètres** | Réglages → persistance, maintenance, sécurité | ⏳ |
| 30 | **Interactions rôles** | Client↔Business↔Dev↔Admin → cohérence globale | ⏳ |

### Fiches détaillées (modèle type)

#### WF-06 — Produits (exemple de fiche type)

**Objectif** : créer/modifier/supprimer un produit doit propager partout.

**Déclencheurs** : créer · modifier · supprimer · stock faible · produit populaire · promotion.

**Relations à vérifier** :
| Étape | Cible | Attendu |
|---|---|---|
| Événement | `PRODUCT_PUBLISHED/MODIFIED/DELETED` | ✅ déjà publiés |
| Notification | propriétaire + abonnés | ✅ |
| Feed | fil social | ⚠️ seulement si publié |
| Analytics | page_view produit | ❌ M3/M10 à ajouter |
| Stock | quantité, seuils | ⚠️ à vérifier |
| Compteurs | nb produits business | ✅ |
| Webhooks | sortants produits | ❌ M8 |
| Data Hub | tendances catégorie | ⚠️ |

**Fichiers clés** : `backend/src/services/product.ts` · `routes/product.ts` ·
`events/publishers/orders.ts` (product events) · `feedHandler.ts` · frontend `features/hooks/products.ts`.

---

## 6. Matrice des rôles

| Rôle | Actions principales | Impacté par | Impacte |
|---|---|---|---|
| **CLIENT** | Commande, réservation, favori, avis, message, follow, parrainage | Notifs business, statuts commande/livraison, promo | CRM business, analytics, recommandations |
| **BUSINESS** | CRUD produits/services, commandes, réservations, employés, livraisons | Notifs client, avis, paiements, litiges | Wallet, stats, feed, notifications client |
| **DÉVELOPPEUR** | CRUD modules, publication, API keys, commissions | Approbation admin, installs clients, paiements | Marketplace, commissions, analytics dev |
| **ADMIN** | Modération, maintenance, config, stats plateforme, KYC | Toutes les actions | Notifications, alertes, stats globales |
| **PARTNER** | Accès Data Hub, rapports, consentements | Approbation admin | Données agrégées, revenus Data Hub |

**Vérification par workflow** : à chaque action d'un rôle, contrôler que les autres rôles
concernés sont bien informés (notifications + dashboards).

---

## 7. Relations transverses

Ces relations concernent TOUS les workflows — à vérifier systématiquement :

### 7.1 Notifications
Toute action métier → `publish*` → `NotificationService` → IN_APP + socket `notification:new`.
Vérifier : mapping `NotificationType` ✅ · template ✅ · payload de notification ✅ · lien ✅.

### 7.2 Analytics
Toute action → `trackAnalyticsEvent({ type, category, eventName, properties, value })` →
`AnalyticsEvent` (table). Catégories observées dans le code (vérifié) : `commercial` · `navigation`
· `system` · `sales` · `profil` · `marketing` · `general` · `finance` · `operations` ·
`client` · `produits` · `inventory` · `hr` · `afriscore` · `VERY_LOW`. À chaque workflow,
utiliser la catégorie la plus adaptée et la documenter dans le rapport.

### 7.3 Logs sécurité / activité
Actions sensibles → `SecurityLogRepository.create()`.
Actions business → journal d'activité (ActivityLog si applicable).

### 7.4 Compteurs
Favoris, followers, vues, likes, nb produits, nb commandes… → **même valeur partout**.
Si plusieurs endroits incrémentent, mutualiser (section 9).

### 7.5 Temps réel
- Admin : `admin:dashboard:update` (30 s) + `admin:presence:update` (présence) + `admin:dashboard:alert`.
- Business : refetch par défaut ; **objectif** = socket `business:{id}` (M9).
- Chat : `conversation:{id}` · Live : `live:{id}`.

### 7.6 Data Hub & Growth Engine
Les actions qui créent de la tendance (commandes, favoris, vues, inscriptions) doivent
alimenter les agrégations Data Hub et les briefs Growth Engine.

---

## 8. Trous connus à combler

> Issus de `docs/blueprint/AFRIBIZ_RELATION_MAP.md` (vérifiés dans le code).

### Critiques
| # | Trou | Statut |
|---|---|---|
| M1 | Favori → AUCUN événement (compteur, stats, CRM, reco, notif) | ❌ |
| M2 | Message → pas d'événement `NEW_MESSAGE` sur le bus | ❌ |
| M3 | Vue produit/service/business → pas d'analytics page_view | ❌ |
| M4 | Avis → pas de recalcul note moyenne / AfriScore vérifié | ⚠️ |

### Importantes
| # | Trou | Statut |
|---|---|---|
| M5 | `automationEngine.evaluateTriggers` mort (jamais appelé) | ❌ |
| M6 | `marketingCampaigns.ts` publishes commentés | ❌ |
| M7 | Feed : 6 types seulement (avis, commentaires, business absents) | ❌ |
| M8 | Webhooks sortants : orders + bookings seulement | ⚠️ |
| M9 | Pas de socket `business:{id}` (dashboard business en refetch) | ⚠️ |
| M10 | Analytics : ~5 services seulement (manquent produits, services, avis, favoris, messages) | ⚠️ |
| M11 | `triggerDashboardUpdate()` peu appelé | ⚠️ |
| M12 | `BUSINESS_ACTIVATED` pas systématique à la création | ⚠️ partiellement corrigé (Workflow 01 : publié dans `activateBusinessRole` si un business existe) |
| M13 | Compteur followers pas visible côté business | ⚠️ |

### Incohérences
| # | Incohérence | Statut |
|---|---|---|
| I1 | Store dupliqué `src/store/notificationStore.ts` = `src/stores/notificationStore.ts` | ❌ |
| I2 | Références fantômes à `src/providers.tsx` (vrai : `src/components/providers.tsx`) | ✅ doc |
| I3 | Deux chemins d'automatisation (automationEngine mort vs RuleEngineService) | ❌ |
| I4 | Mapping NotificationType potentiellement incomplet sur 154 événements | ⚠️ audit |
| I5 | Feed vs Notification déséquilibrés | ❌ |
| I6 | Sockets fragmentés (controllers / handler / service) | ⚠️ |

---

## 9. Services à mutualiser

| # | Service | Mutualisation |
|---|---|---|
| S1 | **counterService** | Incrément/décrément favoris, followers, vues, likes — une seule source |
| S2 | **Recalcul de note** | Note moyenne + volume avis (business, produit, service, menu, room, rental) |
| S3 | **realtimeService** | `io.to(user).emit('notification:new')` + `triggerDashboardUpdate` + `business:{id}` |
| S4 | **analyticsService** | Source unique des agrégations (éviter `_sum`/`_count` dupliqués) |

---

## 10. Définition of Done (DoD)

Un workflow est **validé** uniquement si :

- [ ] **Rapport** écrit au format imposé (4 sections) dans `docs/workflows/NN-*.md`
- [ ] **Flux corrigé** documenté avec organigramme complet (jusqu'à Data Hub / Growth Engine)
- [ ] **Relations créées** vérifiées dans le code (✅ avec preuve)
- [ ] **Relations absentes** listées honnêtement (❌)
- [ ] **tsc backend** : 0 erreur
- [ ] **tsc frontend** : 0 erreur
- [ ] **Tests** : les tests du périmètre passent (aucune régression)
- [ ] **Review** : code-reviewer PASS (pas d'issue bloquante)
- [ ] **Aucune nouvelle fonctionnalité** ajoutée
- [ ] **Aucun changement de design**
- [ ] **PROGRESS.md** mis à jour (statut → ✅)

---

## 11. Registre d'avancement

Voir **[PROGRESS.md](./PROGRESS.md)** — tableau de suivi des 30 workflows avec statut,
date de validation et liens vers les rapports.

---

## 12. Annexes

### 12.1 Documents liés
- `docs/blueprint/TOME-*.md` (30 tomes — spécifications métier par domaine)
- `docs/blueprint/AFRIBIZ_RELATION_MAP.md` (audit des relations)
- `docs/workflows/README.md` (format obligatoire)
- `docs/workflows/01-auth.md` (exemple terminé)

### 12.2 Fichiers clés backend
`events/EventBus.ts` · `events/events.ts` · `events/publishers/*` · `events/handlers/*` ·
`services/NotificationService.ts` · `services/RuleEngineService.ts` ·
`services/CampaignEngineService.ts` · `services/LoyaltyAutomation.ts` ·
`services/CronService.ts` · `services/analyticsService.ts` · `services/presenceService.ts` ·
`services/adminRealtimeService.ts` · `services/socket.ts` · `services/dataHubAnalytics.ts` ·
`services/growthEngineService.ts` · `services/favoriteService.ts` (trou M1) ·
`services/messages.ts` (trou M2) · `services/marketingCampaigns.ts` (trou M6) ·
`server.ts` (enregistrement handlers)

### 12.3 Fichiers clés frontend
`components/providers.tsx` · `components/SocketProvider.tsx` · `hooks/useAdminDashboardRealtime.ts` ·
`hooks/useAdminPresence.ts` · `stores/notificationStore.ts` · `features/afriScoreHooks.ts` ·
`services/apiClient.ts` · `services/api/data-hub.ts` · `app/(dashboard)/dashboard/admin/page.tsx` ·
`app/(dashboard)/dashboard/datahub/page.tsx`
