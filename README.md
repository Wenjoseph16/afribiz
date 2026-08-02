# AfriBiz

**Propulsez votre business en Afrique**

La plateforme SaaS tout-en-un pour les entrepreneurs africains. Gérez votre entreprise, vendez vos produits, et développez votre activité sur tout le continent.

## Stack Technique

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Langage:** TypeScript
- **UI:** Tailwind CSS, Radix UI, shadcn/ui
- **State:** Zustand, TanStack React Query
- **Forms:** React Hook Form + Zod
- **Animation:** Framer Motion
- **PWA:** Service Worker, Offline support
- **Maps:** Leaflet / React Leaflet
- **Charts:** Recharts
- **Thème:** next-themes (dark/light)

### Backend
- **Runtime:** Node.js + Express
- **Langage:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **Queue:** PostgreSQL-based event queue
- **Temps réel:** Socket.IO
- **Paiements:** Stripe, FedaPay, Mobile Money (TMoney, Flooz, Wave, Moov, Orange)
- **IA/ML:** Recommandations, Copilot, Détection de fraude

### DevOps
- **Conteneurisation:** Docker + Docker Compose
- **Orchestration:** Kubernetes (manifests inclus)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry, OpenTelemetry, Prometheus
- **Load Testing:** k6
- **E2E:** Playwright

## Architecture

```
afribiz/
├── frontend/          # Next.js 15 application
│   ├── src/
│   │   ├── app/       # Pages (App Router)
│   │   ├── components/# Composants UI
│   │   └── hooks/     # Hooks personnalisés
│   └── ...
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Configuration
│   │   ├── controllers/ # Route handlers (102)
│   │   ├── services/  # Business logic (135)
│   │   ├── routes/    # API routes (118)
│   │   ├── middlewares/ # Middleware (15)
│   │   ├── validators/ # Zod schemas (29)
│   │   └── events/    # Event-driven system
│   ├── prisma/        # Schema & migrations
│   └── ...
├── shared/            # Types, validators & constants partagés
├── k8s/               # Manifests Kubernetes
├── k6/                # Scripts de load testing
└── e2e/               # Tests Playwright
```

## Prérequis

- Node.js 20+
- PostgreSQL 16
- Redis 7
- npm

## Installation

```bash
# 1. Cloner le projet
git clone https://github.com/Wenjoseph16/afribiz.git
cd afribiz

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Initialiser la base de données
npm run prisma:generate
npm run db:migrate
npm run db:seed

# 5. Démarrer en développement
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001/api
- Documentation API : http://localhost:3001/api/docs
- MailHog (emails dev) : http://localhost:8025

## Scripts Disponibles

```bash
npm run dev              # Démarrer frontend + backend (dev)
npm run build            # Build de production
npm run build:frontend   # Build frontend uniquement
npm run build:backend    # Build backend uniquement
npm run lint             # Linter
npm run type-check       # Vérification TypeScript
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E Playwright
npm run db:seed          # Remplir la base de données
npm run db:studio        # Prisma Studio (exploration DB)
npm run k6:smoke         # Load testing (smoke)
npm run k6:load          # Load testing (charge)
```

## Docker

```bash
# Démarrer les services (Postgres, Redis, MailHog)
docker-compose -f docker-compose.dev.yml up -d

# Démarrer tout (production)
docker-compose up -d
```

## Variables d'Environnement

Voir `.env.example` pour la liste complète.

### ⚠️ Variables Critiques en Production

| Variable | Description | Risque si mal configurée |
|----------|-------------|------------------------|
| `JWT_SECRET` | Clé de signature JWT | Doit être une chaîne aléatoire de 32+ caractères |
| `DEV_BYPASS_OTP` | Bypass OTP de développement | **Ne JAMAIS activer en production** (désactive la 2FA) |
| `ENCRYPTION_KEY` | Clé de chiffrement AES-256 | Doit être une chaîne hexadécimale de 64 caractères |
| `SENTRY_DSN` | Monitoring des erreurs | Configurer pour le suivi en production |
| `REDIS_URL` | Cache Redis | Sans Redis, le fallback mémoire est utilisé |

## Fonctionnalités Clés

### Marketplace
- Catalogue produits et services
- Paiements multi-méthodes (Mobile Money, Carte, Stripe)
- Réservations et rendez-vous
- Commandes et livraisons

### Gestion d'Entreprise
- CRM et Customer 360°
- Comptabilité et facturation
- Employés et paie
- Marketing et campagnes SMS
- Gestion des stocks

### Social Commerce
- Stories (éphémères)
- Shorts (vidéos verticales)
- Lives (streaming + shopping)
- Offres Flash géolocalisées

### Innovations Africaines
- Tontine / Groupes d'épargne
- Achat groupé
- Réseau d'agents
- Taxe multi-pays ZLECAF
- Catalogue vocal
- USSD
- WhatsApp Business

### Plateforme Développeur
- API REST
- SDK
- Modules personnalisés
- Revenue sharing

### IA & Analytics
- Copilot IA
- Recommandations
- Détection de fraude
- AfriScore (notation)
- Data Hub

## Production Readiness

Avant de déployer en production, consulter [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

## Design System

Le design system est défini dans :
- [docs/brand-guidelines.md](./docs/brand-guidelines.md) - Charte graphique complète
- [design-system/afribiz/MASTER.md](./design-system/afribiz/MASTER.md) - Tokens et patterns

## Licence

MIT