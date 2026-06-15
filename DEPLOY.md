# Guide de Déploiement AfriBiz 🚀

Ce guide vous explique comment déployer votre plateforme sur **Neon**, **Render** et **Vercel**.

## 1. Base de données (Neon)
Votre base de données est déjà prête.
**URL :** `postgresql://neondb_owner:npg_EBwhHDvj03Zu@ep-holy-sunset-a23h3a7p-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`

---

## 2. API Backend (Render)
1. Créez un **Web Service** sur [Render](https://render.com).
2. Connectez votre dépôt GitHub.
3. Configurez les paramètres suivants :
   - **Environment** : `Node`
   - **Build Command** : `pnpm install && pnpm run build:backend`
   - **Start Command** : `pnpm start --filter backend`
4. Ajoutez les **Environment Variables** :
   - `DATABASE_URL` : (votre URL Neon)
   - `JWT_SECRET` : `votre_secret_aleatoire`
   - `JWT_REFRESH_SECRET` : `un_autre_secret_aleatoire`
   - `NODE_ENV` : `production`
   - `PORT` : `3001`
   - `FRONTEND_URL` : `https://votre-site.vercel.app` (votre URL Vercel finale)

---

## 3. Frontend (Vercel)
1. Créez un nouveau projet sur [Vercel](https://vercel.com).
2. Connectez votre dépôt GitHub.
3. **IMPORTANT :** Dans les réglages du projet :
   - **Root Directory** : Mettez `frontend`.
   - **Framework Preset** : `Next.js`.
4. Ajoutez les **Environment Variables** :
   - `NEXT_PUBLIC_API_URL` : `https://votre-api.onrender.com/api` (l'URL fournie par Render)

---

## Commandes Utiles (Local)
- **Générer Prisma** : `pnpm run prisma:generate`
- **Build complet** : `pnpm run build`
- **Lancer en dev** : `pnpm run dev`

Si vous avez une erreur Prisma, lancez d'abord : `pnpm install`.
