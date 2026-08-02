# TOME-29 — DevOps & Déploiement

> **Couche Plateforme** — Infrastructure et pipeline CI/CD
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Définir l'infrastructure technique, les pipelines de déploiement, les outils de monitoring, et la stratégie DevSecOps pour assurer la fiabilité et la scalabilité de la plateforme.

---

## 2. Stack DevOps

| Domaine | Technologie |
|---------|-------------|
| Hébergement | VPS (OVH, Scaleway, AWS EC2) ou Vercel (frontend) |
| Base de données | PostgreSQL (Supabase / AWS RDS) |
| Cache | Redis (Upstash / auto-hébergé) |
| File Storage | AWS S3 / Supabase Storage / local uploads |
| Queue | Bull + Redis (file d'attente jobs) |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |
| Monitoring | Sentry (errors), Grafana (métriques), Uptime Robot |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| Logs | Winston → files / ELK stack (v2) |

---

## 3. Pipeline CI/CD (GitHub Actions)

```
git push main
  → lint (ESLint, Prettier)
  → typecheck (TypeScript)
  → test (Jest)
  → build (next build)
  → docker build & push (backend)
  → deploy (SSH + docker-compose restart)
  → notify (#deploy channel)
```

---

## 4. Structure déploiement

```
monorepo/
├── frontend/ → Vercel (auto-deploy)
├── backend/  → VPS Docker (pm2 + Nginx)
│   ├── Dockerfile
│   └── docker-compose.yml (app + redis + nginx)
├── prisma/   → migrations automatisées
└── scripts/  → backup, seed, maintenance
```

---

## 5. Stratégie Backup

- **Base de données** : dump quotidien (cron) → S3
- **Uploads** : snapshot quotidien S3
- **Rétention** : 7 jours (daily), 4 semaines (weekly), 6 mois (monthly)
- **Restore procedure** : script automatisé

---

## 6. Monitoring & Alertes

- **Sentry** : erreurs frontend + backend, alertes Slack si erreur 500
- **Grafana** : métriques (CPU, RAM, DB connections, Redis)
- **Uptime Robot** : health check /api/health toutes les 5 min
- **Logs** : Winston (fichiers tournants, 7 jours)

---

## 7. Scripts maintenance

| Script | Utilisation |
|--------|-------------|
| `scripts/backup-db.sh` | Backup base de données |
| `scripts/restore-db.sh` | Restauration base |
| `scripts/deploy.sh` | Déploiement complet |
| `scripts/seed.sh` | Données de test |
| `scripts/check-health.sh` | Vérification santé |
| `scripts/cron-jobs.sh` | Lancement CRON |

---

## 8. Variables d'environnement

**Fichiers :** `.env.local`, `.env.production`, `.env.example`

**Groupes :**
- `DATABASE_URL` — PostgreSQL
- `REDIS_URL` — Redis
- `JWT_SECRET`, `NEXTAUTH_SECRET` — Auth
- `WAVE_API_KEY`, `TMONEY_*` — Mobile Money
- `SENTRY_DSN` — Monitoring
- `AWS_*` — Storage
- `NEXT_PUBLIC_APP_URL` — Frontend URL
- `ADMIN_EMAILS` — Admins système

---

**AC :** CI/CD → déploiement automatique → monitoring → backup → recovery