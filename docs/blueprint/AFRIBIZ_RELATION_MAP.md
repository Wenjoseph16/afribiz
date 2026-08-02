# AFRIBIZ RELATION MAP

> Document d'architecture produit par le Software Architect Principal.
> Objectif : supprimer l'effet « site statique » — chaque action utilisateur doit propager
> ses conséquences dans tout l'écosystème (données, dashboards, stats, notifications,
> compteurs, widgets, automatisations, historique, logs).
>
> **Règle de la mission : aucun fichier de code n'a été modifié pour produire ce rapport.
> L'implémentation des connexions manquantes ne commencera qu'après validation.**

---

## SOMMAIRE

1. [L'infrastructure existante (le socle)](#1-linfrastructure-existante-le-socle)
2. [Relations DÉJÀ existantes](#2-relations-déjà-existantes)
3. [Relations MANQUANTES](#3-relations-manquantes)
4. [Incohérences détectées](#4-incohérences-détectées)
5. [Connexions à créer](#5-connexions-à-créer)
6. [Services à mutualiser](#6-services-à-mutualiser)
7. [Doublons à supprimer](#7-doublons-à-supprimer)
8. [États globaux à centraliser](#8-états-globaux-à-centraliser)
9. [Événements à créer](#9-événements-à-créer)
10. [Synchronisations à mettre en place](#10-synchronisations-à-mettre-en-place)
11. [Matrice des actions (exemples)](#11-matrice-des-actions-exemples)
12. [Plan d'implémentation priorisé](#12-plan-dimplémentation-priorisé)

---

## 1. L'infrastructure existante (le socle)

La bonne nouvelle : **le socle événementiel existe déjà et est bien construit**. Le problème
n'est pas l'absence d'infrastructure, mais **l'absence de câblage** sur de nombreux points d'entrée.

| Brique | Fichier | État |
|---|---|---|
| Bus d'événements | `backend/src/events/EventBus.ts` | ✅ Actif (154 types d'événements) |
| File de persistance | `backend/src/events/QueueService.ts` | ✅ At-least-once delivery |
| Publishers par domaine | `backend/src/events/publishers/*.ts` | ✅ Bien organisés (commerce, orders, etc.) |
| Notifications multi-canaux | `backend/src/services/NotificationService.ts` | ✅ Mapping ~150 événements → NotificationType + templates + canaux (IN_APP/EMAIL/SMS/WHATSAPP/PUSH) + suivi de délivrance |
| Handler notifications | `backend/src/events/handlers/notificationHandler.ts` | ✅ Écoute tout + émet `notification:new` par socket |
| Handler feed | `backend/src/events/handlers/feedHandler.ts` | ⚠️ Ne couvre que 6 types d'événements |
| Moteur de règles | `backend/src/services/RuleEngineService.ts` | ✅ Écoute tout + évalue les règles d'automatisation |
| Moteur de campagnes | `backend/src/services/CampaignEngineService.ts` | ✅ Écoute tout |
| Fidélité automatique | `backend/src/services/LoyaltyAutomation.ts` | ✅ ORDER_PLACED + PAYMENT_RECEIVED |
| Tâches avancées | `backend/src/services/advancedTasks.ts` | ✅ ORDER_PLACED + BOOKING_CREATED |
| CRON (rappels/alertes) | `backend/src/services/CronService.ts` | ✅ ~22 types d'événements programmés |
| Analytics | `backend/src/services/analyticsService.ts` | ⚠️ `trackAnalyticsEvent` appelé dans SEULEMENT 4 services |
| Temps réel admin | `backend/src/services/adminRealtimeService.ts` | ⚠️ Broadcast 30 s ; `triggerDashboardUpdate` peu appelé |
| Socket.IO | `backend/src/services/socket.ts` | ✅ Rooms `user:{id}`, `admin:alerts`, `admin:dashboard`, `conversation:{id}`, `live:{id}` |
| Frontend socket | `frontend/src/components/SocketProvider.tsx` | ✅ Écoute `notification:new`, messages |
| Providers frontend | `frontend/src/components/providers.tsx` | ✅ Theme, Language, Query, Analytics, Toast, Maintenance |

**Enregistrement des handlers** — `backend/src/server.ts` :
`registerNotificationHandlers()`, `registerFeedHandlers()`, `registerAutomationHandlers()`,
`registerLoyaltyAutomation()`, `RuleEngineService.start()`, `CampaignEngineService.start()`,
`startDashboardRealtime(30000)`.

---

## 2. Relations DÉJÀ existantes

| Action déclencheur | Événement publié | Conséquences déjà câblées |
|---|---|---|
| Commande créée | `ORDER_PLACED` | ✅ Notification client + business, fidélité (points), tâches avancées, webhooks, analytics (le feed ne couvre PAS ORDER_PLACED) |
| Paiement reçu | `PAYMENT_RECEIVED` | ✅ Notification, fidélité, commission, escrow |
| Produit publié/modifié/supprimé | `PRODUCT_PUBLISHED/MODIFIED/DELETED` | ✅ Notification, feed (si publié), webhook |
| Service publié | `SERVICE_PUBLISHED` | ✅ Notification + feed |
| Réservation créée | `BOOKING_CREATED` | ✅ Notification, tâches avancées, webhooks, analytics |
| Avis publié | `REVIEW_PUBLISHED` | ✅ Notification + moteur de règles (déclencheur CRM) |
| Commentaire créé | `COMMENT_CREATED` | ✅ Notification |
| Follow / Unfollow | `FOLLOWED` / `UNFOLLOWED` | ✅ Notification |
| Promotion démarrée | `PROMOTION_STARTED` | ✅ Notification + feed |
| Livraison assignée/démarrée/complétée | `DELIVERY_*` | ✅ Notification |
| Escrow créé/libéré/remboursé/litigé | `ESCROW_*` | ✅ Notification |
| Dette réglée | `DEBT_SETTLED` | ✅ Notification |
| Panier abandonné (CRON) | `CART_ABANDONED` | ✅ Notification |
| Stock faible / rupture (CRON) | `LOW_STOCK` / `OUT_OF_STOCK` | ✅ Notification |
| Anniversaire client (CRON) | `CLIENT_BIRTHDAY` | ✅ Notification |
| Rappel réservation (CRON) | `BOOKING_REMINDER` | ✅ Notification |
| Briefing matin / résumé soir | `MORNING_BRIEF_GENERATED` / `EVENING_SUMMARY_GENERATED` | ✅ Notification |
| Parrainage invité/converti/récompensé | `REFERRAL_*` | ✅ Notification |
| Événement à venir | `UPCOMING_EVENT` | ✅ Notification + feed |
| Location créée | `RENTAL_CREATED` | ✅ Notification + feed |
| Location en retard / retour | `RENTAL_OVERDUE` / `RENTAL_RETURNED` | ✅ Notification |
| Épargne / tontine | `SAVINGS_*` | ✅ Notification |
| Signalement créé/résolu | `REPORT_CREATED` / `REPORT_RESOLVED` | ✅ Notification |
| Session de vente sociale | `SOCIAL_SHARE_*` | ✅ Notification |

---

## 3. Relations MANQUANTES

### 🔴 Critiques (impact visible utilisateur)

| # | Point d'entrée | Manque | Fichier |
|---|---|---|---|
| M1 | **Favori ajouté/retiré** | ❌ **AUCUN événement publié** — pas de compteur produit, pas de compteur business, pas de stats, pas de CRM, pas d'historique client, pas de Data Hub, pas de Growth Engine, pas de recommandations, pas de classement, pas de popularité, pas de notification | `backend/src/services/favoriteService.ts` |
| M2 | **Message envoyé** | ❌ Pas d'événement `NEW_MESSAGE` sur le bus → pas de NotificationService, pas d'analytics, pas de compteur, pas de feed. (Émission socket directe dans les controllers uniquement) | `backend/src/controllers/messages.ts` |
| M3 | **Vue produit / page publique** | ❌ `trackAnalyticsEvent` non appelé sur les vues produits/services/business (seulement orders, cart, bookings, customer360) | `backend/src/services/product.ts`, services publics |
| M4 | **Avis publié** | ⚠️ Notification ✅ mais **pas de recalcule de la note moyenne business, pas de mise à jour AfriScore, pas de stats** vérifiés côté événement (à vérifier dans `reviewService`) | `backend/src/services/reviewService.ts` |

### 🟠 Importantes (cohérence inter-modules)

| # | Point d'entrée | Manque |
|---|---|---|
| M5 | `automationEngine.evaluateTriggers` | ❌ **Défini mais JAMAIS appelé** (seuls les tests l'utilisent) — le chemin vivant est `RuleEngineService` ; risque de double chemin mort |
| M6 | `marketingCampaigns.ts` | ❌ Publishes **commentés** (`publishCampaignStarted`, `publishCampaignCompleted`) — câblage désactivé |
| M7 | Feed | ❌ Seulement 6 types d'événements → feed. Manquent : avis, commentaires, nouveaux business, inscriptions, etc. |
| M8 | Webhooks sortants | ⚠️ Seuls orders + bookings `fireWebhookEvent` — pas produits, paiements, livraisons, avis |
| M9 | Dashboard business temps réel | ⚠️ Pas de socket `business:{id}` — les KPIs business se rafraîchissent par refetch, pas en temps réel (contrairement à l'admin) |
| M10 | Analytics couverture | ⚠️ `trackAnalyticsEvent` seulement dans orders, cart, bookings, customer360 — manquent produits, services, avis, favoris, follows, messages, promotions, événements, livraisons |

### 🟡 Mineures

| # | Point | Détail |
|---|---|---|
| M11 | `adminRealtimeService.triggerDashboardUpdate` | Défini mais peu appelé après mutations (broadcast périodique 30 s uniquement) |
| M12 | Nouveau business créé | Pas d'événement `BUSINESS_ACTIVATED` systématique publié à la création (vérifier onboarding) |
| M13 | Suivi de business (follow) | `FOLLOWED` ✅ notification mais pas de compteur `followerCount` visible côté business vérifié |

---

## 4. Incohérences détectées

| # | Incohérence | Détail |
|---|---|---|
| I1 | **Store notification dupliqué** | `frontend/src/store/notificationStore.ts` et `frontend/src/stores/notificationStore.ts` sont **identiques** (même taille, même préfixe). Seul `@/stores/notificationStore` est importé → `src/store/` est mort |
| I2 | **`src/providers.tsx` fantôme** | Le fichier-picker a signalé `src/providers.tsx` mais il n'existe pas — le vrai est `src/components/providers.tsx` (importé dans `app/layout.tsx`). Aucun problème fonctionnel, mais attention aux références |
| I3 | **Deux chemins d'automatisation** | `automationEngine.evaluateTriggers` (mort) vs `RuleEngineService` (vivant) — deux implémentations de règles avec des modèles de conditions différents |
| I4 | **TypeMapping partiel potentiel** | Sur 154 événements, certains pourraient ne pas avoir de `NotificationType` mapping (ex. à vérifier : `MODULE_UNINSTALLED`, `EMPLOYEE_LATE`, etc. — la plupart sont mappés, mais un audit exhaustif est nécessaire) |
| I5 | **Feed vs Notification déséquilibrés** | Notification écoute TOUT ; le feed n'écoute que 6 types — un utilisateur reçoit une notif mais le fil social ne reflète pas l'action |
| I6 | **Sockets fragmentés** | Le chat émet via controllers, les notifications via handler, l'admin via service dédié — 3 mécanismes différents sans convention unique |

---

## 5. Connexions à créer

Par ordre de priorité (toutes utilisent l'infrastructure EXISTANTE, aucune nouvelle feature) :

1. **Publier `FAVORITE_ADDED` / `FAVORITE_REMOVED`** dans `favoriteService.ts` → déclencher :
   - compteur favoris produit + business
   - stats business / popularité / classement
   - CRM (activité client) / historique client
   - Data Hub / Growth Engine / recommandations
   - notification (optionnelle, par préférence)
2. **Publier `NEW_MESSAGE`** sur le bus dans `messages.ts` (le socket direct reste) → NotificationService + analytics + compteurs.
3. **Ajouter `trackAnalyticsEvent`** sur les vues produits/services/business publics (page_view) — l'infra `AnalyticsEvent` existe déjà.
4. **Câbler `triggerDashboardUpdate()`** après les mutations business critiques (commande, réservation, paiement, avis) pour un dashboard business temps réel.
5. **Réactiver les publishes** dans `marketingCampaigns.ts` (décommenter + compléter metadata).
6. **Étendre `feedHandler`** : avis, commentaires, nouveaux business, etc.
7. **Étendre `fireWebhookEvent`** aux produits, paiements, livraisons, avis (le système webhook public existe).
8. **Recalculer note/AfriScore** à `REVIEW_PUBLISHED` si non fait.

---

## 6. Services à mutualiser

| # | Service | Mutualisation |
|---|---|---|
| S1 | **Compteurs** | Créer un service `counterService` unique (incrément favoris, followers, vues, likes) consommé par tous les publishers — au lieu de `updateMany({ increment })` dispersés |
| S2 | **Recalcul de note** | Centraliser le calcul de note moyenne + volume d'avis business (utilisé par product, service, menu, room, rental, business) |
| S3 | **Émission socket** | Factoriser `io.to(user).emit('notification:new', ...)` + `triggerDashboardUpdate` + `business:{id}` dans un `realtimeService` unique |
| S4 | **Stats agrégées** | `analyticsService` doit devenir LA source unique des agrégations (déjà amorcé) — éviter les `_sum`/`_count` dupliqués dans chaque controller |

---

## 7. Doublons à supprimer

| # | Doublon | Action |
|---|---|---|
| D1 | `frontend/src/store/notificationStore.ts` (dupliqué de `stores/notificationStore.ts`) | Supprimer `src/store/` (vérifier imports) |
| D2 | `automationEngine.evaluateTriggers` (mort) | Supprimer OU brancher sur RuleEngineService ; garder le CRUD (utilisé par le controller) |
| D3 | Implémentations de conditions de règles | Unifier dans RuleEngineService (les deux utilisent `AutomationRule` mais avec des évaluations différentes) |

---

## 8. États globaux à centraliser

| # | État | Cible |
|---|---|---|
| G1 | **Compteurs en temps réel** (favoris, followers, vues, likes) | Store ou cache central (`counterService`) + invalidation query frontend par socket |
| G2 | **Notifications non lues** | Déjà centralisé (`useSidebarUnreadCount`, `notificationStore`) ✅ — étendre au compteur business |
| G3 | **Maintenance mode** | Déjà centralisé (`useMaintenanceStore`) ✅ |
| G4 | **État business courant** | Déjà centralisé (`useBusinessStore`) ✅ |
| G5 | **Événements analytics temps réel** | Déjà centralisé (`AnalyticsProvider` + page realtime) ✅ — l'étendre aux nouveaux trackers |

---

## 9. Événements à créer

Nouveaux `DomainEventType` (dans `backend/src/events/events.ts`) + publishers associés :

| # | Événement | Publier depuis | Consommateurs prévus |
|---|---|---|---|
| E1 | `FAVORITE_ADDED` | `favoriteService.addFavorite` | Notif, analytics, compteurs, CRM, recommandations |
| E2 | `FAVORITE_REMOVED` | `favoriteService.removeFavorite` | analytics, compteurs |
| E3 | `NEW_MESSAGE` (sur le bus) | `messages.ts` | NotificationService, analytics (le socket direct reste) |
| E4 | `PRODUCT_VIEWED` | vues produits | analytics page_view |
| E5 | `SERVICE_VIEWED` | vues services | analytics page_view |
| E6 | `BUSINESS_VIEWED` | page business publique | analytics + popularité |
| E7 | `CAMPAIGN_STARTED` / `CAMPAIGN_COMPLETED` | `marketingCampaigns.ts` | Notification, analytics |
| E8 | `REVIEW_UPDATED` (si besoin) | `reviewService` | Recalcul note/AfriScore |

> Note : `NEW_MESSAGE` existe déjà dans le typeMapping NotificationService — mais n'est pas publié par
> le service de messages (émission socket directe uniquement). **`FAVORITE_ADDED`, `FAVORITE_REMOVED`,
> `PRODUCT_VIEWED`, `SERVICE_VIEWED`, `BUSINESS_VIEWED`, `CAMPAIGN_STARTED`, `CAMPAIGN_COMPLETED`
> n'existent NI dans l'enum `DomainEventType` NI dans le typeMapping — ils devront être créés
> (enum + publishers + typeMapping + eventTitles) dans le cadre de l'implémentation.**

---

## 10. Synchronisations à mettre en place

| # | Sync | Mécanisme |
|---|---|---|
| T1 | **Dashboard business temps réel** | Socket room `business:{id}` + `triggerDashboardUpdate()` après commande/réservation/paiement/avis |
| T2 | **Compteurs favoris** | Handler sur `FAVORITE_ADDED/REMOVED` → incrément/décrément produit + business |
| T3 | **Note moyenne + volume avis** | Handler sur `REVIEW_PUBLISHED` → recalcul note business (tous types) |
| T4 | **Analytics events** | Ajouter `trackAnalyticsEvent` aux nouveaux points (vues, favoris, messages) |
| T5 | **Feed** | Étendre `feedHandler` aux avis/commentaires/business |
| T6 | **AfriScore** | Abonner `afriScoreService` à `REVIEW_PUBLISHED`, `ORDER_DELIVERED`, `DISPUTE_RESOLVED` |

---

## 11. Matrice des actions (exemples)

### Exemple A — Client ajoute un produit en favori

| Étape | Cible | État |
|---|---|---|
| Action | `POST /favorites` | Existe |
| Événement | `FAVORITE_ADDED` | ❌ **À créer** |
| Données modifiées | Favorite + compteur produit + compteur business | ⚠️ Favorite seule |
| Services appelés | favoriteService → counterService → analytics → notif | ⚠️ favoriteService seul |
| Modules concernés | Produits, CRM, Data Hub, Growth Engine, Recommandations | ❌ Aucun |
| Dashboards concernés | Business (popularité), Client (favoris), Admin (stats) | ⚠️ Client seul |
| Notifications | (optionnel) | ❌ |
| Automatisations | Règle « produit favori » possible | ❌ |
| Statistiques | popularité produit, top favoris | ❌ |
| Widgets | widgets dashboard business | ❌ |
| Historique | ClientActivityLog | ❌ |
| Logs | SecurityLog / ActivityLog | ❌ |
| Growth Engine | signal de demande | ❌ |
| Data Hub | signal de tendance | ❌ |

### Exemple B — Commande passée (déjà câblé ✅)

| Étape | Cible | État |
|---|---|---|
| Action | `createOrder` | ✅ |
| Événement | `ORDER_PLACED` | ✅ |
| Données modifiées | Order, OrderItem, stock (si géré), compteurs | ✅ |
| Services appelés | orders → eventBus → NotificationService, LoyaltyAutomation, advancedTasks, webhooks, analytics | ✅ |
| Modules concernés | Commandes, Fidélité, Tâches, Webhooks, Analytics | ✅ |
| Dashboards concernés | Business (commandes), Client (commandes), Admin | ⚠️ Realtime business absent |
| Notifications | Client + business | ✅ |
| Automatisations | règles ORDER_PLACED | ✅ |
| Statistiques | analytics order | ✅ |
| Widgets | dashboard business | ⚠️ refetch |
| Historique | ClientActivityLog | ⚠️ à vérifier |
| Logs | SecurityLog | ⚠️ |
| Growth Engine | opportunités | ⚠️ |
| Data Hub | tendances | ⚠️ |

---

## 12. Plan d'implémentation priorisé

> ⚠️ **En attente de validation** — aucune implémentation faite.

**Phase 1 — Câblage minimal (5 connexions critiques)**
1. `FAVORITE_ADDED` / `FAVORITE_REMOVED` publiés par `favoriteService` + handler compteurs
2. `NEW_MESSAGE` publié sur le bus depuis `messages.ts` (socket direct conservé)
3. `trackAnalyticsEvent` ajouté sur vues produits/services/business (page_view)
4. `triggerDashboardUpdate()` branché après commande/réservation/paiement
5. Suppression du store dupliqué `src/store/notificationStore.ts`

**Phase 2 — Cohérence (4 connexions)**
6. Recalcul note moyenne + AfriScore sur `REVIEW_PUBLISHED`
7. Réactivation publishes `marketingCampaigns.ts`
8. Extension `feedHandler` (avis, commentaires, business)
9. Extension `fireWebhookEvent` (produits, paiements, livraisons, avis)

**Phase 3 — Nettoyage (3 actions)**
10. Unifier `automationEngine` vs `RuleEngineService`
11. Créer `counterService` mutualisé
12. Créer `realtimeService` unique (notif + dashboard business + admin)

---

## Annexe — Fichiers clés analysés

- `backend/src/events/EventBus.ts`, `QueueService.ts`, `events.ts`, `publishers/*`
- `backend/src/services/NotificationService.ts`, `NotificationChannels.ts`, `adminRealtimeService.ts`, `adminNotificationService.ts`, `socket.ts`, `analyticsService.ts`
- `backend/src/services/favoriteService.ts` ← **trou principal**
- `backend/src/services/orders.ts`, `bookings.ts`, `cart.ts`, `product.ts`, `reviewService.ts`, `messages.ts`, `followService.ts`, `commentService.ts`, `promotions.ts`, `delivery.ts`, `debtsPayments.ts`, `savingsGroupService.ts`, `referral.ts`, `socialShareService.ts`, `contentReportService.ts`, `escrowStepsService.ts`, `marketingCampaigns.ts`, `automationEngine.ts`, `RuleEngineService.ts`, `CampaignEngineService.ts`, `LoyaltyAutomation.ts`, `growthEngineService.ts`, `CronService.ts`
- `backend/src/events/handlers/notificationHandler.ts`, `feedHandler.ts`
- `backend/src/server.ts` (enregistrement handlers)
- `frontend/src/components/providers.tsx`, `SocketProvider.tsx`, `ThemeProvider.tsx`
- `frontend/src/store/notificationStore.ts` vs `frontend/src/stores/notificationStore.ts` ← **doublon**
- `frontend/src/hooks/useAdminDashboardRealtime.ts`, `useMessageNotifications.ts`, `useConversationSocket.ts`
- `frontend/src/components/analytics/AnalyticsProvider.tsx`
