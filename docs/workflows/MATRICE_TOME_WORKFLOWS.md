# MATRICE TOME → WORKFLOW — Checklist d'exécution AfriBiz

> Document de travail du Software Architect Principal.
> Source : lecture INTÉGRALE des 31 TOMEs du blueprint (`docs/blueprint/`) croisée avec
> l'état RÉEL du code (vérifié dans `backend/src`, `frontend/src`, `prisma`).
>
> ⚠️ Contrairement à la `AFRIBIZ_RELATION_MAP.md` (datée, écrite avant le chantier A+B),
> cette matrice reflète l'état actuel après les commits `cebc7d7`, `95a8eb7`, `c307884`.
>
> **Règle** : on exécute UN chantier à la fois, testé + reviewé + commité, puis on coche.

---

## LÉGENDE

| Symbole | Signification |
|---|---|
| ✅ | Fait et vérifié dans le code |
| ⚠️ | Partiel — un maillon manque |
| 🔴 | Manquant / cassé |
| ⏸️ | Hors scope (déployement : non, tu as dit de tout finir avant) |

---

## COUCHE FONDATION

### TOME-01 — Auth, Sécurité & Onboarding `[Critique]`
**Workflows :** Inscription (email/téléphone) → vérification OTP → 2FA/WebAuthn → session JWT (15 min + refresh) → onboarding progressif.

| Point | État | Détail vérifié |
|---|---|---|
| Inscription + login + rôles | ✅ | `services/auth.ts`, `controllers/auth.ts`, tests OK |
| JWT access/refresh + rotation | ✅ | `middlewares/auth.ts` |
| 2FA TOTP/SMS/Email | ✅ | `twoFactorController.ts`, `twoFactorService.ts` |
| WebAuthn | ✅ | `webauthnService.ts` |
| Rate limiting login | ✅ | `rateLimiter.ts` (5 tentatives → blocage) |
| SecurityLog (échecs, tentatives) | ✅ | modèle + logging |
| Notifications d'accueil | ✅ | `publishUserLoggedIn`, onboarding |
| DEV_BYPASS_OTP | ⚠️ | Présent pour dev, documenté « ne pas activer en prod » |

**Verdict TOME-01 : ✅ complet — rien à faire.**

---

### TOME-02 — Profil Business & Paramètres `[Critique]`
**Workflows :** Onboarding business → page publique → vérification/KYC → paramètres → AfriScore.

| Point | État | Détail vérifié |
|---|---|---|
| Création business (onboarding) | ✅ | `createBusiness` + `publishOnboardingCompleted` |
| BUSINESS_ACTIVATED publié | ✅ | `publishers/auth.ts` + `feedHandler` (BUSINESS_UPDATE) |
| Page publique (`/:slug`) | ✅ | `getPublicBusiness` + sections complètes |
| Vérification documents | ✅ | `submitVerification` + admin |
| Paramètres + heures + paiements | ✅ | `updatePublicPage`, `businessHour` |
| AfriScore | ✅ | `afriScoreService.ts` complet |

**Verdict TOME-02 : ✅ complet.**

---

### TOME-03 — Produits, Services, Menu & Formations `[Critique]`
**Workflows :** CRUD catalogue → catégories → variantes → stock → publication.

| Point | État | Détail vérifié |
|---|---|---|
| CRUD produits | ✅ | `services/product.ts` + events `PRODUCT_PUBLISHED/MODIFIED/DELETED` |
| CRUD services | ✅ | `services/service.ts` + `SERVICE_PUBLISHED` |
| Menu / catégories / tables / QR | ✅ | `menu.ts` complet |
| Formations / leçons | ✅ | `training.ts` + `trainingBusiness.ts` |
| Stock faible / rupture (cron) | ✅ | `CronService` → `LOW_STOCK`/`OUT_OF_STOCK` |

**Verdict TOME-03 : ✅ complet.**

---

### TOME-04 — Commandes & Panier `[Critique]`
**Workflows :** Panier → checkout → commande → statuts → stock.

| Point | État | Détail vérifié |
|---|---|---|
| Panier (client) | ✅ | `services/cart.ts` + events |
| Création commande | ✅ | `services/orders.ts` → `ORDER_PLACED` |
| Statuts + événements | ✅ | `publishOrderStatusChanged` |
| Nouveau client détecté | ✅ | `publishNewClient` |
| Paiement lié (received/failed) | ✅ | `publishPaymentReceived/Failed` |
| Panier abandonné (cron) | ✅ | `CART_ABANDONED` |
| Stock décrémenté | ✅ | dans `orders.ts` |

**Verdict TOME-04 : ✅ complet.**

---

### TOME-05 — Réservations, Chambres, Locations & Événements `[Haute]`
**Workflows :** Créneau → réservation → rappel → check-in/out → no-show. Chambres. Locations. Billetterie QR.

| Point | État | Détail vérifié |
|---|---|---|
| CRUD réservations + créneaux | ✅ | `services/bookings.ts` + blocked-dates + ressources |
| BookingCreated/StatusChanged | ✅ | `publishBookingCreated/StatusChanged` |
| Rappels J-1 (cron) | ✅ | `BOOKING_REMINDER` dans CronService |
| Rooms + blocked dates | ✅ | `room.ts` (GET/DELETE `/blocked-dates`) |
| Rentals | ✅ | `rental.ts` |
| Événements + billets + participants | ✅ | `events.ts` + QR |
| Réservation publique sans auth | ✅ | route publique `/public/bookings` |
| No-show auto 30 min | ⚠️ | À vérifier dans CronService (statut marqué ?) |

**Verdict TOME-05 : ✅ quasi complet — seul point : vérifier no-show automatique.**

---

### TOME-06 — Paiements, Escrow, Dettes & Wallet `[Critique]`
**Workflows :** Mobile Money → webhook → statut. Escrow → libération. Dettes + rappels. Wallet + retraits.

| Point | État | Détail vérifié |
|---|---|---|
| Paiement Mobile Money (simulé sandbox) | ✅ | `hybridPaymentService.ts` + fallback simulé |
| Webhook FedaPay / Stripe | ✅ | `fedaPayWebhook.ts` (sandbox) |
| Paiement manuel + preuve | ✅ | `PaymentProof` + vérification |
| Escrow complet (held/released/refund) | ✅ | `escrowStepsService.ts` + events |
| Commissions (1% / 2%) | ✅ | `monetizationConfig.ts` |
| Dettes + rappels J-7..J+30 | ✅ | `debtsPayments.ts` + cron |
| Wallet + transactions + retraits | ✅ | `wallet.ts` |
| KYC > 500 000 FCFA | ✅ | migration KYC/AML appliquée |

**Verdict TOME-06 : ✅ complet (sandbox).**

---

### TOME-07 — Abonnements & Monétisation `[Haute]`
**Workflows :** Plans (Gratuit/Basic/Premium) → souscription → privilèges → commission.

| Point | État | Détail vérifié |
|---|---|---|
| Modèles (SubscriptionPlan, Privilege, BusinessSubscription) | ✅ | schéma complet |
| Plans plateforme (Gratuit/Basic/Premium) seedés | ✅ | `seedTestData.ts` (Gratuit public) |
| **Souscription à un plan plateforme** | 🔴 | **`subscribeToPlan` renvoie 400** si `businessId` null — les plans publiques ne sont PAS souscriptibles. Le flux BusinessSubscription → plan plateforme n'existe pas. |
| Privilèges appliqués | ⚠️ | `checkPrivilege` existe-t-il ? (à auditer) |
| Commission transaction | ✅ | `monetizationConfig.ts` |

**Verdict TOME-07 : ⚠️ partiel — manque le flux de souscription au plan plateforme (Gratuit est affiché au pricing mais non souscriptible).**

---

### TOME-08 — Livraisons `[Haute]`
> NB : le TOME-08 blueprint est un squelette de 15 lignes. Le code est bien plus avancé.

| Point | État | Détail vérifié |
|---|---|---|
| Zones de livraison | ✅ | `delivery.ts` + `deliveryZone` |
| Livreurs + assignation | ✅ | driver CRUD + assign |
| Suivi statuts | ✅ | `DELIVERY_*` events + push `business:{id}` |
| Suivi client public | ✅ | endpoint tracking client |

**Verdict TOME-08 : ✅ complet (code > blueprint).**

---

### TOME-09 → TOME-14 — Employés, Planning, Partenaires, Documents, Tontines, Litiges `[Moyenne]`
> TOMEs squelettes (23-30 lignes). Le code couvre tout.

| TOME | État | Détails vérifiés |
|---|---|---|
| 09 Employés & RH | ✅ | `employees.ts`, congés, pointage, paie |
| 10 Planning & Tâches | ✅ | `planning.ts`, `advancedTasks.ts` + events |
| 11 Partenaires | ✅ | `partner.ts` + contrats/commissions |
| 12 Documents & Signatures | ✅ | `documents.ts`, signatures électroniques, PDF |
| 13 Tontines & Épargne | ✅ | `savingsGroupService.ts` (ROSCA complet) |
| 14 Litiges & Support | ✅ | `disputes.ts` + tickets support + escrow |

**Verdict 09-14 : ✅ complets.**

---

## COUCHE CLIENT

### TOME-15 — CRM & Clients `[Haute]`
**Workflows :** Tracking vues → segmentation → 360° → LTV → automation CRM.

| Point | État | Détail vérifié |
|---|---|---|
| trackPageView / trackProductView | ✅ | `customer360.ts` + routes `/track/*` |
| Client 360 + segments + LTV | ✅ | `customer360.ts` |
| Events CRM (inactif, anniversaire, segment) | ✅ | `publishers/crm.ts` complets |
| Automation CRM | ✅ | `RuleEngineService` triggers CRM |

**Verdict TOME-15 : ✅ complet.**

---

### TOME-16 — Devis, Factures & Comptabilité `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| Devis → facture → conversion | ✅ | `quotesInvoices.ts` |
| PDF génération | ✅ | `pdfGenerator.ts` |
| Comptabilité + exports | ✅ | `accounting.ts` |

**Verdict TOME-16 : ✅ complet.**

---

### TOME-17 — Messages & Chat `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Conversations + sockets | ✅ | `controllers/messages.ts` rooms `conversation:{id}` |
| NEW_MESSAGE sur le bus | ✅ | `publishNewMessage` l.220/282 |
| Notifications + read receipts | ✅ | sockets `message:new`, `message:read` |

**Verdict TOME-17 : ✅ complet.**

---

### TOME-18 — Avis & Évaluations `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Avis produit/service + recalcul | ✅ | `reviewService.ts` |
| **Avis business (création client)** | ✅ | **CHANTIER B FAIT** — `createBusinessReview` + route + form |
| Recalcul note business | ✅ | `recalculateBusinessRating` (chantier B) |
| Réponse du business | ✅ | `respondToBusinessReview` + `REVIEW_RESPONSE` |
| REVIEW_PUBLISHED → notif + room | ✅ | `businessRoomHandler` |

**Verdict TOME-18 : ✅ complet (depuis chantier B).**

---

## COUCHE MARKETING

### TOME-19 — Marketing, Promotions & Fidélité `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| Promotions + coupons + bundles | ✅ | `promotions.ts` + events |
| Fidélité (points, paliers, tiers) | ✅ | `LoyaltyAutomation.ts` |
| Birthday bonus (cron) | ✅ | `CLIENT_BIRTHDAY` |
| **Campagnes marketing → events bus** | 🔴 | **`marketingCampaigns.ts` : publishes commentés (l.115) — les campagnes n'émettent RIEN (pas de notif, pas d'analytics)** |

**Verdict TOME-19 : ⚠️ — 1 maillon cassé : les campagnes marketing.**

---

### TOME-20 — Social (Stories, Shorts, Live, Feed, Offres Flash) `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Stories (24h, highlights, vues) | ✅ | `storyService.ts` |
| Shorts (likes, commentaires) | ✅ | `shortService.ts` |
| Live + chat + ventes | ✅ | `liveService.ts` + room `live:{id}` |
| Offres Flash géolocalisées | ✅ | `offerFlashService.ts` |
| Feed | ✅ | `feedService.ts` + posts |
| Follow + compteurs | ✅ | `followService.ts` |
| **Feed événementiel (feedHandler)** | ⚠️ | **7 types seulement** (PRODUCT, SERVICE, PROMOTION, FLASH, EVENT, RENTAL, BUSINESS_ACTIVATED) sur 154 — pas d'avis, commentaires, nouveaux business, etc. |

**Verdict TOME-20 : ⚠️ — feed événementiel trop limité.**

---

### TOME-21 — Publicité (Ads) `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Campagnes + créatifs + packages | ✅ | `ads.ts` complet |
| Slots (AdSlot restauré) | ✅ | migration drift |
| Validation admin + events | ✅ | admin routes |
| Facturation ad | ✅ | `AdInvoice` |

**Verdict TOME-21 : ✅ complet.**

---

### TOME-22 — Portfolio & Témoignages `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Items + catégories + médias | ✅ | `portfolio.ts` |
| Interactions publiques (likes/commentaires) | ✅ | endpoints publics (chantier antérieur) |

**Verdict TOME-22 : ✅ complet.**

---

### TOME-23 — Marketplace Développeurs `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| Profil développeur + vérification | ✅ | `developer.ts` |
| Modules + versions + validation | ✅ | `developerModules.ts` |
| Installation + abonnement module | ✅ | installations + subscriptions |
| Commission + payout | ✅ | revenue/payout |
| API keys + webhooks développeur | ✅ | `developerApi.ts` |

**Verdict TOME-23 : ✅ complet.**

---

## COUCHE INTELLIGENCE

### TOME-24 — Analytics & Dashboard `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| Modèles (AnalyticsEvent, PeriodAggregation, MetricSnapshot…) | ✅ | restaurés + migration `20260802010000` |
| **`analyticsService.ts` (trackAnalyticsEvent)** | 🔴 | **FICHIER ABSENT — perdu au git restore.** Le modèle `AnalyticsEvent` existe en base mais **AUCUN code ne l'alimente** (`grep analyticsEvent` = 0 résultat hors tests). |
| Page `/dashboard/analytics` | ✅ | **CHANTIER A FAIT** (health, funnel, engagement, tendances, cohortes) — mais branchée sur `dataHubAnalytics` (agrégations à la volée), PAS sur AnalyticsEvent |
| Page `/dashboard/analytics/realtime` | 🔴 | Absente (flux d'événements temps réel) |
| Page `/dashboard/analytics/reports` | 🔴 | Absente |
| Page `/dashboard/analytics/custom` | 🔴 | Absente |

**Verdict TOME-24 : 🔴 — le trou le plus gros. `analyticsService` doit être recréé + trackers câblés (commandes, réservations, paiements, vues) + pages realtime/reports/custom.**

---

### TOME-25 — Rapports & Export `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| `reportService.ts` (8 types, génération) | ✅ | 765 lignes, exports JSON/CSV/PDF |
| ScheduledReport + ReportDeliveryLog | ✅ | modèles restaurés + job cron `scheduled-reports` |
| Page `/dashboard/reports` | ✅ | catalogue + génération + téléchargement |
| **Page `/dashboard/reports/scheduled`** | 🔴 | **Absente du disque** (perdue au restore) — backend prêt |

**Verdict TOME-25 : ⚠️ — 1 page manquante (scheduled).**

---

### TOME-26 — Notifications & Alerting `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| NotificationService multi-canaux | ✅ | IN_APP/EMAIL/SMS/WHATSAPP/PUSH |
| Migration PUSH | ✅ | `add_push_channel` |
| Templates + préférences | ✅ | `notification-templates` |
| BusinessAlert | ✅ | alertes |

**Verdict TOME-26 : ✅ complet.**

---

### TOME-27 — Localisation & Multilingue `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Modèles Translation/Key/Region/Country/City | ✅ | restaurés (drift) |
| **Service i18n backend + endpoints** | ⚠️ | À vérifier : `localizationService` ? Routes `/translations` ? |
| Frontend i18n (fr/en…) | ⚠️ | `next-i18next` annoncé mais pas vérifié dans le code |

**Verdict TOME-27 : ⚠️ à auditer (modèles ✅, service/pages ?).**

---

### TOME-28 — Modération & Admin `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| Console admin complète (43 pages) | ✅ | `dashboard/admin/*` |
| Modération contenu + avis signalés | ✅ | `contentReportService.ts` + admin |
| Maintenance mode + page 503 | ✅ | fait (chantier antérieur) |
| **Pages publiques CMS** (`/blog`, `/faq`, `/conformite`, `/cookies`) | 🔴 | **Absentes du disque** (perdues au restore) |

**Verdict TOME-28 : ⚠️ — pages publiques manquantes.**

---

### TOME-29 — DevOps & Déploiement `[Haute]`
> ⏸️ **HORS SCOPE** — « pas de déploiement pour le moment, on doit tout finir avant. »
> Rien à exécuter. Les configs k8s/docker/CI existent déjà.

---

### TOME-30 — API Publique & Webhooks `[Moyenne]`
| Point | État | Détail vérifié |
|---|---|---|
| Routes `/v1` + swagger | ✅ | `publicApi.ts` + swagger (YAML corrigé) |
| **`fireWebhookEvent` métier (order.created, payment.completed…)** | 🔴 | **ABSENT — 0 match dans le backend.** Seuls les webhooks développeur (`developerApi.ts`) existent. Aucun webhook sortant pour les événements métier. |

**Verdict TOME-30 : 🔴 — émission de webhooks métier à recréer.**

---

### TOME-31 — Sécurité & Conformité `[Haute]`
| Point | État | Détail vérifié |
|---|---|---|
| KYC/AML (actions + migration) | ✅ | `20260801000000_add_kyc_aml_actions` |
| Page `/conformite` publique | 🔴 | Absente (DPO, incidents P0-P3, rétention) |
| Bannière cookies | ✅ | `CookieConsent.tsx` |
| Data retention + RGPD | ✅ | `admin/data-retention` |

**Verdict TOME-31 : ⚠️ — 1 page publique manquante (conformite).**

---

## 🔴 SYNTHÈSE — Les vrais chantiers restants (classés par impact)

| # | Chantier | TOME | Impact « vivant » | Effort |
|---|---|---|---|---|
| **1** | **Recréer `analyticsService.ts` + câbler les trackers** (AnalyticsEvent alimenté par commandes/réservations/paiements/vues + pages realtime) | 24 | ⭐⭐⭐⭐⭐ Le modèle existe en base mais rien ne le nourrit — la plateforme est « aveugle » sur ses propres actions | Moyen+ |
| **2** | **Réactiver les publishes `marketingCampaigns`** (décommenter) | 19 | ⭐⭐⭐ Les campagnes émettent enfin des events (notifs + analytics) | Petit |
| **3** | **Recréer l'émission webhooks métier** (`fireWebhookEvent` : order.created, payment.completed…) | 30 | ⭐⭐⭐ Pilier de l'écosystème développeur | Moyen |
| **4** | **Étendre `feedHandler`** (avis, commentaires, nouveaux business…) | 20 | ⭐⭐ Le fil social reflète les actions réelles | Moyen |
| **5** | **Page `/dashboard/reports/scheduled`** | 25 | ⭐⭐ Backend prêt, 404 sur le dashboard | Moyen |
| **6** | **Flux de souscription plan plateforme** (Gratuit souscriptible) | 07 | ⭐⭐ Monétisation bloquée | Moyen |
| **7** | **Pages publiques** `/blog`, `/faq`, `/conformite`, `/cookies` | 28/31 | ⭐⭐ 404 sur le site public | Moyen |
| **8** | **Audit i18n** (service localization + pages) | 27 | ⭐ Localisation | Petit |
| **9** | **Vérifier no-show auto 30 min** (réservations) | 05 | ⭐ Correctif ponctuel | Petit |

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

```
1.  Chantier 1  → analyticsService + trackers (débloque la « vie » de la plateforme)
2.  Chantier 2  → marketingCampaigns (petit, effet immédiat)
3.  Chantier 3  → webhooks métier
4.  Chantier 4  → feed étendu
5.  Chantier 5  → page reports/scheduled
6.  Chantier 6  → souscription plans plateforme
7.  Chantier 7  → pages publiques (blog, faq, conformite, cookies)
8.  Chantier 8  → audit i18n
9.  Chantier 9  → no-show auto
```

> Chaque chantier : analyse → implémentation → tests (jest + tsc) → review → commit → coche ✅ ici.
