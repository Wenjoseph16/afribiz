# TOME-30 — API Publique & Webhooks

> **Couche Plateforme** — Interface programmable pour les développeurs tiers
> Statut : Référence | Priorité : Moyenne

---

## 1. Objectifs métier

Exposer une API REST publique documentée permettant aux développeurs externes d'intégrer les fonctionnalités AfriBiz dans leurs propres applications.

---

## 2. API Publique

**Base URL :** `https://api.afribiz.com/v1`

**Authentification :** Bearer Token (API Key)

**Endpoints :**

### Business
- `GET /v1/businesses` — Liste des businesses
- `GET /v1/businesses/:slug` — Détails d'un business
- `GET /v1/businesses/:slug/products` — Produits
- `GET /v1/businesses/:slug/services` — Services

### Produits
- `GET /v1/products` — Catalogue produits
- `GET /v1/products/:id` — Détail produit
- `GET /v1/categories` — Catégories

### Commandes
- `POST /v1/orders` — Créer une commande
- `GET /v1/orders/:id` — Suivi commande
- `GET /v1/orders/:id/status` — Statut en temps réel

### Paiements
- `POST /v1/payments/mobile-money/initiate` — Initier paiement
- `GET /v1/payments/:reference/status` — Vérifier statut

### Réservations
- `POST /v1/bookings` — Créer réservation
- `GET /v1/bookings/:id` — Voir réservation

### Webhooks
- `POST /v1/webhooks/subscribe` — S'abonner à un événement
- `GET /v1/webhooks/subscriptions` — Voir abonnements
- `DELETE /v1/webhooks/subscriptions/:id` — Désabonner

---

## 3. Événements Webhook

| Événement | Déclencheur |
|-----------|-------------|
| `order.created` | Nouvelle commande |
| `order.status_changed` | Changement statut commande |
| `payment.completed` | Paiement confirmé |
| `payment.failed` | Paiement échoué |
| `booking.confirmed` | Réservation confirmée |
| `booking.cancelled` | Réservation annulée |
| `delivery.started` | Livraison en route |
| `delivery.completed` | Livraison terminée |
| `review.created` | Nouvel avis |
| `business.updated` | Profil business modifié |

---

## 4. Rate Limiting

- **100 req/min** par API Key (standard)
- **500 req/min** (premium)
- Retour `429 Too Many Requests` avec header `Retry-After`

---

## 5. Documentation

- **Swagger/OpenAPI** : `https://api.afribiz.com/docs`
- **Postman collection** : exportable
- **Exemples de code** : curl, JavaScript, Python, PHP

---

## 6. SDK (v2)

- SDK JavaScript/TypeScript : `npm install @afribiz/sdk`
- SDK Python : `pip install afribiz-sdk`
- SDK PHP : en développement

---

**AC :** Auth API Key → endpoints REST → webhooks événements → rate limiting → doc