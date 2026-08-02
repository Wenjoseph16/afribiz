# Workflow #02 — Profil Client

> Cadre : MASTER.md · Format imposé (Flux actuel / Flux corrigé / Relations créées / Relations absentes)
> Statut : ✅ Validé

---

## 1. Flux actuel

```
Client
  ↓
Profil / Favoris / Avis / Vues produit (frontend)
  ↓
API (favorites.ts, reviews.ts, marketplace /product/:slug)
  ↓
Services (favoriteService, reviewService, marketplace)
  ↓
DB (Favorite, Review, Product, Business)
```

**Ce qui manquait (état avant) :**

```
Favori ajouté/retiré  →  DB  →  ❌ fin de chaîne (aucun événement, aucun analytics)
Avis publié           →  DB  →  ⚠️ événement avec businessId = productId (bug)
Réponse à un avis     →  DB  →  ⚠️ mauvais événement (REVIEW_PUBLISHED au lieu de REVIEW_RESPONSE)
Note business         →  DB  →  ❌ jamais recalculée depuis BusinessReview
Vue produit           →  cache →  ❌ aucun tracking (et impossible derrière le cache)
```

---

## 2. Flux corrigé

### 2.1 Favoris (M1)

```
Client
  ↓
POST /api/favorites / DELETE /api/favorites/:id
  ↓
favoriteService.addFavorite / removeFavorite
  ↓
DB (Favorite créée/supprimée)
  ↓
publishFavoriteAdded / publishFavoriteRemoved  (EventBus)
  ↓
NotificationService (typeMapping SYSTEM + titre « Favori ajouté/retiré »)
  ↓
trackAnalyticsEvent (category 'client', eventName favorite_added / favorite_removed)
  ↓
AnalyticsEvent (Data Hub / Analytics)
```

### 2.2 Avis produit/service (M4)

```
Client
  ↓
POST /api/reviews  (createReview)
  ↓
DB (Review créée) + recalc note produit/service (déjà existant ✅)
  ↓
Résolution du businessId RÉEL (product/service → business)   [corrigé]
  ↓
publishReviewPublished (bon businessId + bon businessName)
  ↓
Business répond → POST /api/reviews/:id/respond
  ↓
publishReviewResponse (événement correct + userId = auteur de l'avis)   [corrigé]
```

### 2.3 Note Business (M4)

```
Admin approuve / masque / supprime un avis business
  ↓
routes/admin.ts (businessReview isActive: true/false / delete)
  ↓
recalculateBusinessRating(businessId)   [ajouté]
  ↓
Business.rating + Business.reviewCount synchronisés
  ↓
Fiche publique business / marketplace / Data Hub à jour
```

### 2.4 Vue produit (M3)

```
Visiteur
  ↓
GET /api/marketplace/product/:slug
  ↓
trackProductView (middleware AVANT cacheResponse)   [ajouté — corrige le bug cache]
  ↓
trackAnalyticsEvent (category 'navigation', eventName product_viewed)
  ↓
cacheResponse (payload mis en cache comme avant)
  ↓
productBySlug (contrôleur)
```

---

## 3. Relations créées ✅

| Relation | Événement / Câblage | Fichiers |
|---|---|---|
| Favoris → EventBus | `FAVORITE_ADDED`, `FAVORITE_REMOVED` | `events/events.ts`, `events/publishers/crm.ts` |
| Favoris → Notifications | typeMapping + eventTitles (SYSTEM) | `services/NotificationService.ts` |
| Favoris → Analytics | `favorite_added` / `favorite_removed` | `services/favoriteService.ts` |
| Avis → businessId réel | résolution product/service → business | `services/reviewService.ts` |
| Réponse avis → événement correct | `publishReviewResponse` (REVIEW_RESPONSE) | `services/reviewService.ts` |
| Avis business → note business | `recalculateBusinessRating` (approve/hide/delete) | `services/business.ts`, `routes/admin.ts` |
| Vue produit → Analytics | `trackProductView` avant cache | `controllers/marketplace.ts`, `routes/marketplace.ts` |

---

## 4. Relations encore absentes ❌

| Relation | Impact | Pourquoi |
|---|---|---|
| Favoris → compteur produit/business | Pas de champ `favoriteCount` sur Product/Business | Nécessite migration Prisma (non faite — à planifier) |
| Favoris → CRM client | Pas de câblage vers le profil client CRM | À faire dans le Workflow CRM |
| Note Business → AfriScore | `afriScoreService` lit BusinessReview mais n'est pas re-déclenché par `recalculateBusinessRating` | À câbler dans le Workflow AfriScore |
| Vue produit → recommandations | Pas de câblage vers le moteur de recommandations | À faire dans le Workflow Recommandations |
| Page profil → historique activité | Pas de fil d'activité client consolidé | À faire dans le Workflow Data Hub |

---

## ✅ Validation

- `tsc` backend : **CLEAN**
- Jest : **57 tests PASS** (favorites + reviews : controllers, services, intégration)
- Review : **PASS** (1 bug réel détecté — tracking derrière le cache — corrigé par middleware)
