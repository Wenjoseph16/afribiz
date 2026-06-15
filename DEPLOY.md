# Guide de Déploiement AfriBiz 🚀

Ce guide vous explique comment déployer votre plateforme sur **Neon**, **Render** et **Vercel**.

## 1. Base de données (Neon)

### Configuration existante
Votre base de données est déjà prête sur Neon.

**URL de connexion :**
```
postgresql://neondb_owner:npg_EBwhHDvj03Zu@ep-holy-sunset-a23h3a7p-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Étapes pour Neon
1. Connectez-vous à [Neon Console](https://neon.tech/app)
2. Créez un nouveau projet ou utilisez le existant
3. Dans **Database Branches** → **Connection**, copiez l'URL de connexion
4. Ajoutez cette URL dans les variables d'environnement `DATABASE_URL`

---

## 2. API Backend (Render)

### Prérequis
- Compte Render (plan gratuit disponible)
- Repository GitHub connecté à Render

### Configuration Render

| Paramètre | Valeur |
|-----------|--------|
| **Service Type** | Web Service |
| **Environment** | Node |
| **Build Command** | `pnpm install && pnpm run build:backend` |
| **Start Command** | `pnpm start --filter backend` |
| **Root Directory** | Laissez vide (déployez depuis la racine) |

### Variables d'Environnement Backend

```bash
DATABASE_URL=<votre_url_neon>
JWT_SECRET=<généré_aléatoirement_32_caractères>
JWT_REFRESH_SECRET=<généré_aléatoirement_32_caractères>
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://<votre-domaine-vercel>.vercel.app
ALLOWED_ORIGINS=https://<votre-domaine-vercel>.vercel.app
SENTRY_DSN=<votre_dsn_sentry_optionnel>
STRIPE_SECRET_KEY=<votre_clé_stripe_optionnelle>
```

**Pour générer les secrets :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configuration render.yaml (déploiement automatique)

Le fichier [`render.yaml`](render.yaml) configure automatiquement :
- Le build et le démarrage du serveur
- La génération automatique de `JWT_SECRET` et `JWT_REFRESH_SECRET`
- Les variables sensibles via `sync: false` (à configurer manuellement)

---

## 3. Frontend (Vercel)

### Prérequis
- Compte Vercel
- Repository GitHub connecté à Vercel

### Configuration Vercel

1. Créez un projet sur [Vercel](https://vercel.com/new)
2. **Root Directory** : `frontend`
3. **Framework Preset** : `Next.js`
4. **Build Command** : `pnpm run build` (par défaut)
5. **Output Directory** : `.next` (par défaut)

### Variables d'Environnement Frontend

```bash
NEXT_PUBLIC_API_URL=https://<votre-api-render>.onrender.com/api
NEXT_PUBLIC_APP_NAME=AfriBiz
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SENTRY_DSN=<votre_dsn_sentry_optionnel>
```

### Configuration vercel.json

Le fichier [`frontend/vercel.json`](frontend/vercel.json) configure :
- Les limites de durée des fonctions
- Les domains d'images autorisées
- Les headers CORS pour les requêtes API

---

## 4. Flux de Déploiement

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Neon DB       │────▶│   Render API    │────▶│   Vercel FE     │
│ (PostgreSQL)    │     │ (Express.js)    │     │ (Next.js)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       ▲                       ▲                       ▲
       │                       │                       │
       └─── DATABASE_URL ──────┴─── API_URL ───────────┘
```

---

## 5. Commandes Utiles (Local)

```bash
# Installer les dépendances
pnpm install

# Développer localement (frontend + backend)
pnpm run dev

# Build complet
pnpm run build

# Générer Prisma
pnpm run prisma:generate

# Vérifier les types TypeScript
pnpm run type-check

# Linter
pnpm run lint

# Formater le code
pnpm run format
```

---

## 6. Déploiement Manuel vs Automatique

### Render (Backend)
- **Automatique** : Via [`render.yaml`](render.yaml) - push sur GitHub déclenche le déploiement
- **Manuel** : Configuration via dashboard Render

### Vercel (Frontend)
- **Automatique** : Import du repository GitHub, chaque push sur `main` déploie
- **Preview Deployments** : Les PRs ont un URL temporaire

---

## 7. Dépannage

### Erreurs Prisma
```bash
# Régénérer le client Prisma
pnpm run prisma:generate

# Exécuter les migrations
cd backend && pnpm exec prisma migrate deploy
```

### Erreurs CORS
- Vérifiez que `FRONTEND_URL` et `ALLOWED_ORIGINS` sur le backend correspondent à votre domaine Vercel
- Exemple : `https://afribiz.vercel.app`

### Erreurs de Build
1. Vérifiez les logs sur Render/Vercel
2. Testez le build localement : `pnpm run build`
3. Vérifiez les variables d'environnement

### WebSocket (Socket.io)
- Render a un plan gratuit avec limitations WebSocket
- Pour la production, considèrez Redis ou un service dédié

---

## 8. Checklist de Déploiement

- [ ] Base de données Neon créée et accessible
- [ ] Variables d'environnement configurées sur Render
- [ ] `DATABASE_URL` fonctionnel sur Render
- [ ] `FRONTEND_URL` configuré sur Render
- [ ] Variables d'environnement configurées sur Vercel
- [ ] `NEXT_PUBLIC_API_URL` pointe vers votre API Render
- [ ] Testez l'API : `https://<votre-api>.onrender.com/api/health`
- [ ] Testez le site : `https://<votre-site>.vercel.app`

---

## 9. URLs de Production

Après déploiement, vos URLs seront :
- **Frontend** : `https://<votre-site>.vercel.app`
- **Backend API** : `https://<votre-api>.onrender.com`
- **Documentation API** : `https://<votre-api>.onrender.com/api/docs`
