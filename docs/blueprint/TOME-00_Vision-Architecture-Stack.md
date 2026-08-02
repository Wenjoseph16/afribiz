# TOME-00 — Vision, Architecture & Stack Technique

> **Couche Fondation** — Document fondateur du blueprint AfriBiz
> Statut : Référence | Priorité : Critique

---

## 1. Objectifs métier

### 1.1 Vision produit

AfriBiz est une **plateforme SaaS panafricaine** qui permet aux micro, petites et moyennes entreprises (MPME) africaines de se digitaliser en quelques minutes, sans compétence technique, sans carte bancaire, et sans investissement initial.

**Problème résolu :** En Afrique, 80 % des MPME n'ont pas de présence en ligne. Les solutions existantes (Shopify, WooCommerce) sont inadaptées car :
- Elles exigent une carte bancaire internationale
- Elles ne supportent pas le Mobile Money (Wave, TMoney, Flooz, Moov)
- Elles sont en anglais, sans contextualisation africaine
- Elles sont trop complexes et trop chères

**Valeur ajoutée :**
- Curation gratuite (plan Gratuit) avec paiement à l'usage (1 % par transaction)
- Mobile Money natif — pas de CB nécessaire
- Interface en français, adaptée aux réalités africaines
- Écosystème complet : boutique, réservations, livraison, CRM, compta, marketing

### 1.2 Marché cible

| Segment | Description | Priorité |
|---------|-------------|----------|
| Commerçants | Boutiques physiques, revendeurs, grossistes | Prioritaire |
| Restaurateurs | Restaurants, traiteurs, food-trucks | Prioritaire |
| Prestataires de services | Coiffeurs, artisans, réparateurs, consultants | Prioritaire |
| Hôteliers & hébergeurs | Hôtels, auberges, locations saisonnières | Moyen |
| Organisateurs d'événements | Salles de fête, planificateurs, promoteurs | Moyen |
| Artisans & producteurs | Artisanat local, produits agricoles, transformation | Moyen |

### 1.3 Couverture géographique

- **Phase 1 :** Côte d'Ivoire, Sénégal, Cameroun (francophone, Mobile Money mature)
- **Phase 2 :** Bénin, Togo, Burkina Faso, Mali, Niger (UEMOA)
- **Phase 3 :** Ghana, Nigeria, Kenya (anglophone, M-Pesa)
- **Phase 4 :** Reste de l'Afrique

### 1.4 Modèle économique

| Flux | Description |
|------|-------------|
| **Commission transactions** | 1 % sur chaque vente réussie |
| **Commission escrow** | 2 % sur les transactions sécurisées |
| **Abonnements Premium** | Plans Basic/Premium avec fonctionnalités avancées |
| **Marketplace développeurs** | 15-20 % de commission sur les ventes de modules |
| **Publicité** | Packages ads pour la visibilité |
| **Formations** | Ventes de formations par les businesses |

---

## 2. Architecture technique

### 2.1 Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Site     │  │ Dashboard│  │ Pages    │  │ Admin   │ │
│  │ Public   │  │ Business │  │ Client   │  │ Panel   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Services : React Query, Zustand, Socket.io Client │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST + WebSocket
                         │
┌────────────────────────┴────────────────────────────────┐
│                   BACKEND (Node.js/Express)              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Auth     │  │ Business │  │ Payments │  │ Admin   │ │
│  │ Module   │  │ Module   │  │ Module   │  │ Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Marketpl.│  │ Copilot  │  │ CRM      │  │ Others  │ │
│  │ Module   │  │ Module   │  │ Module   │  │ Modules │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Middlewares : Auth, CSRF, Rate-Limit, Cache,      │ │
│  │  Sanitize, Audit, Compression, CORS, Metrics       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Services : Prisma ORM, Redis Cache, Socket.io,   │ │
│  │  JWT, Nodemailer, Twilio, Stripe, FedaPay, Bull   │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │PostgreSQL│ │  Redis   │ │  Stockage│
    │   (DB)   │ │ (Cache)  │ │ (Uploads)│
    └──────────┘ └──────────┘ └──────────┘
```

### 2.2 Stack technique détaillée

#### Frontend

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Next.js 14 (App Router)** | Framework React | RSC, SSR, routing, SEO, middleware |
| **React 18** | UI Library | Écosystème riche, communauté |
| **TypeScript** | Typage | Sécurité, maintenabilité, DX |
| **TanStack React Query** | Data fetching | Cache, déduplication, SSR, mutations |
| **Zustand** | State management | Léger, simple, performant |
| **Framer Motion** | Animations | API déclarative, performante |
| **Axios** | HTTP client | Interceptors, typage, cancellation |
| **Socket.io Client** | Temps réel | Notifications en direct, chat, tracking |
| **Tailwind CSS** | Styling | Utility-first, rapide, personnalisable |
| **Lucide React** | Icônes | Légère, complète, arbre secouable |
| **React Hook Form** | Formulaires | Performant, validation, typage |
| **Zod** | Validation schémas | Compatible RHF, auto-typage |

#### Backend

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Node.js 24** | Runtime | Performant, écosystème mature |
| **Express 4** | Framework HTTP | Simple, flexible, middlewares |
| **TypeScript** | Typage | Même langue que le frontend |
| **Prisma 5** | ORM | Types automatiques, migrations, requêtes |
| **PostgreSQL 16** | Base de données | Robuste, performant, écosystème |
| **Redis 7** | Cache / Session / Queue | Rapide, pub/sub, files d'attente |
| **Socket.io** | WebSocket temps réel | Salles, événements, fallback polling |
| **Bull** | File d'attente | Jobs background, retry, monitoring |
| **JWT (jsonwebtoken)** | Authentification | Stateless, sécurisé, standard |
| **Nodemailer** | Emails transactionnels | Fiable, templates |
| **Twilio / Meta API** | WhatsApp / SMS | Canaux de communication africains |
| **Stripe** | Paiements carte | Standard international |
| **FedaPay / PayDunya** | Mobile Money | Paiements africains locaux |
| **Helmet** | Sécurité HTTP | Headers de sécurité |
| **express-rate-limit** | Rate limiting | Anti brute-force |
| **Winston** | Logging | Structured, levels, transports |

#### DevOps & Qualité

| Technologie | Usage |
|-------------|-------|
| **ESLint** | Linting TypeScript/React |
| **Jest + React Testing Library** | Tests unitaires |
| **Husky** | Pre-commit hooks |
| **lint-staged** | Linting auto sur staged |
| **Docker** | Conteneurisation |
| **Vercel** | Déploiement frontend |
| **Railway / Render** | Déploiement backend |

### 2.3 Contraintes d'architecture

| Contrainte | Décision |
|------------|----------|
| **Bas débit / offline** | PWA, offline sync, chargement progressif |
| **Mobile First** | Tous les dashboards sont responsive |
| **Coût serveur** | Cache Redis agressif, mise en cache public |
| **Sécurité** | JWT court (15 min), refresh token, CSRF, rate limiting |
| **Multilingue** | i18n français/anglais dès la conception |
| **Multi-pays** | Devise, téléphone, adresse par pays |

---

## 3. Structure du monorepo

```
afribiz/
├── backend/                          # Serveur Node.js/Express
│   ├── prisma/
│   │   ├── schema.prisma             # 284 modèles de données
│   │   ├── seed.ts                   # Données initiales plateforme
│   │   └── seedTestData.ts           # Données de test
│   ├── src/
│   │   ├── server.ts                 # Point d'entrée (545 lignes)
│   │   ├── config/                   # Configuration (env, swagger)
│   │   ├── controllers/              # Route handlers (50+)
│   │   ├── routes/                   # Définitions de routes (80+)
│   │   ├── services/                 # Logique métier (60+)
│   │   ├── middlewares/              # Auth, CSRF, cache, rate-limit
│   │   ├── validators/               # Schémas de validation (Zod)
│   │   ├── lib/                      # DB, cache, logger, JWT, queue
│   │   ├── events/                   # Event handlers, notification
│   │   └── seed-data/               # Templates d'automatisation
│   ├── dist/                         # Build TypeScript
│   └── uploads/                      # Fichiers uploadés
│
├── frontend/                         # Client Next.js 14
│   ├── src/
│   │   ├── app/                      # App Router (400+ pages)
│   │   │   ├── (auth)/               # Auth pages
│   │   │   ├── (dashboard)/          # Dashboard (business/admin)
│   │   │   ├── (public)/             # Pages publiques
│   │   │   └── ...                   # Routes racine (book, events...)
│   │   ├── components/               # Composants React (180+)
│   │   ├── services/                 # API client (74 fichiers)
│   │   ├── stores/                   # Zustand stores
│   │   ├── hooks/                    # Custom hooks
│   │   ├── features/                 # Feature-specific hooks
│   │   └── constants/                # Constantes, types
│   └── public/                       # Assets statiques
│
├── shared/                           # Types partagés (optionnel)
│
├── docs/                             # Documentation
│   └── blueprint/                    # Ce document
│
├── .husky/                           # Pre-commit hooks
└── package.json                      # Monorepo root
```

---

## 4. Principes de conception

### 4.1 Design System

Le design system AfriBiz repose sur trois piliers :

1. **Mobile First** — Tous les écrans sont conçus pour le mobile d'abord
2. **Afrique** — Couleurs chaudes, typographie adaptée, Mobile Money natif
3. **Conversion** — Chaque page est optimisée pour convertir (CTA, preuve sociale, urgence)

Non couvert dans ce blueprint : les tokens précis du design system (couleurs, espacements, typographie). Un tome dédié au Design System pourra être ajouté ultérieurement.

### 4.2 Règles de codification

| Règle | Description |
|-------|-------------|
| **Nommage routes** | RESTful, pluriels, kebab-case (`/api/business/products`) |
| **Nommage composants** | PascalCase, un fichier par composant |
| **Nommage fonctions** | camelCase, verbeux (`getPublicPricing`) |
| **Nommage fichiers** | kebab-case pour pages, services ; PascalCase pour composants |
| **Types** | Interfaces dans des fichiers `.types.ts` ou à côté du composant |
| **Tests** | Un fichier `__tests__/Component.test.tsx` par composant |

---

## 5. Glossaire étendu

| Terme | Définition |
|-------|-----------|
| **Escrow** | Paiement séquestré : l'argent est bloqué jusqu'à confirmation de réception |
| **Mobile Money** | Service de paiement par téléphone mobile (Wave, TMoney, Flooz, Moov Money, M-Pesa) |
| **Tontine** | Association rotative d'épargne où les membres cotisent à tour de rôle |
| **AfriScore** | Score de réputation calculé sur les transactions, avis, et complétude du profil |
| **Copilot** | Assistant IA qui analyse les données et envoie des conseils et alertes |
| **Module** | Extension fonctionnelle (ex: réservations, menu, livraison) activable sur un profil |
| **Offre Flash** | Promotion à durée limitée avec géolocalisation |
| **QR Menu** | Menu de restaurant accessible par QR code |
| **Business** | Commerçant, artisan ou prestataire inscrit sur la plateforme |
| **Client** | Acheteur final (B2C) |
| **Développeur** | Créateur de modules marketplace |
| **Admin** | Gestionnaire de la plateforme AfriBiz |
| **SLUG** | Identifiant URL unique et lisible (ex: `mon-resto-dabidjan`) |
| **Commission** | Pourcentage prélevé par AfriBiz sur chaque transaction |
| **Plan** | Niveau d'abonnement (Gratuit, Basic, Premium) avec privilèges associés |
| **Cycle de tontine** | Période de rotation complète d'un groupe d'épargne |
| **Zone de livraison** | Secteur géographique couvert par un business pour ses livraisons |
| **Template** | Modèle réutilisable (notification, email, contrat) |
| **Feature Flag** | Interrupteur fonctionnel activable/désactivable par l'admin |
| **Webhook** | Callback HTTP déclenché par un événement pour les développeurs |

---

## 6. Cas d'usage principaux (Use Cases)

| ID | Use Case | Acteur | Tome |
|----|----------|--------|------|
| UC-01 | S'inscrire et configurer son profil | Business | 01 |
| UC-02 | Gérer son catalogue produits/services | Business | 03 |
| UC-03 | Recevoir et traiter une commande | Business | 04 |
| UC-04 | Gérer les réservations | Business | 05 |
| UC-05 | Payer via Mobile Money | Client | 06 |
| UC-06 | Sécuriser un paiement via Escrow | Client + Business | 06 |
| UC-07 | Souscrire à un abonnement Premium | Business | 07 |
| UC-08 | Planifier une livraison | Business | 08 |
| UC-09 | Gérer son équipe | Business | 09 |
| UC-10 | Suivre ses clients (CRM) | Business | 15 |
| UC-11 | Créer un devis et facturer | Business | 16 |
| UC-12 | Lancer une promotion | Business | 19 |
| UC-13 | Publier un module sur le marketplace | Développeur | 23 |
| UC-14 | Consulter son AfriScore | Business | 24 |
| UC-15 | Automatiser une tâche récurrente | Business | 26 |
| UC-16 | Consulter le dashboard admin | Admin | 29 |

---

## 7. Critères d'acceptation du blueprint

| AC | Critère |
|----|---------|
| AC-00-01 | Chaque tome existe et suit le format standard |
| AC-00-02 | Chaque modèle Prisma est référencé dans au moins un tome |
| AC-00-03 | Chaque route API est documentée dans le tome correspondant |
| AC-00-04 | Les permissions sont spécifiées par rôle pour chaque action |
| AC-00-05 | Les notifications sont listées par événement déclencheur |
| AC-00-06 | Les cas particuliers et erreurs sont documentés |
| AC-00-07 | Les critères d'acceptation de chaque tome sont testables |
| AC-00-08 | Le glossaire est maintenu et cohérent entre les tomes |