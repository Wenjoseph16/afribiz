# AfriBiz - Production Checklist

## Before Going Live

### Sécurité - CRITIQUE

- [ ] `JWT_SECRET` changé (32+ caractères aléatoires, jamais celui du `.env.example`)
- [ ] `JWT_REFRESH_SECRET` changé (64+ caractères aléatoires)
- [ ] `DEV_BYPASS_OTP` = `''` (vide) — **ne JAMAIS activer en production**
- [ ] `ENCRYPTION_KEY` configurée (chaîne hex 64 caractères)
- [ ] HSTS activé (déjà configuré dans helmet)
- [ ] CSP headers vérifiés pour les ressources externes
- [ ] Rate limiting configuré (déjà fait, vérifier les seuils)
- [ ] CSRF protection active
- [ ] CORS restreint au domaine frontend uniquement
- [ ] Cookies en mode `Secure`, `HttpOnly`, `SameSite`
- [ ] Audit log activé pour les événements critiques

### Base de Données

- [ ] Migrations Prisma appliquées
- [ ] Backup automatisé configuré
- [ ] Connection pooling configuré (PgBouncer recommandé)
- [ ] Index manquants vérifiés (lire les logs de requêtes lentes)
- [ ] Rétention des données configurée (GDPR)

### Performance

- [ ] Redis configuré (pas de fallback mémoire)
- [ ] Compression gzip/brotli activée (déjà fait)
- [ ] Images servies via CDN/cloud (pas de stockage local)
- [ ] Cache headers configurés sur les assets statiques
- [ ] Bundle optimization Next.js (déjà fait via `next build`)
- [ ] Lazy loading des composants lourds (déjà fait : maps, players)
- [ ] ISR/SSG pour les pages publiques à évaluer

### Monitoring & Observabilité

- [ ] Sentry DSN configuré
- [ ] OpenTelemetry actif
- [ ] Prometheus metrics exposées
- [ ] Alerting configuré (uptime, erreurs, latence)
- [ ] Logs centralisés (Winston → fichier + console, à étendre vers un service)

### Infrastructure

- [ ] Docker images pushées vers registry (GHCR)
- [ ] Kubernetes manifests validés
- [ ] Health checks configurés
- [ ] Resource limits définies (CPU/Memory)
- [ ] HPA (Horizontal Pod Autoscaler) configuré
- [ ] Network policies appliquées
- [ ] TLS/SSL certificats valides
- [ ] Domaine configuré avec DNS

### Frontend

- [ ] Meta tags OG/Twitter (déjà configurés dans `layout.tsx`)
- [ ] Favicon et icônes Apple (déjà présents)
- [ ] Manifest PWA (déjà présent)
- [ ] Service Worker testé
- [ ] Page offline fonctionnelle
- [ ] 404, error, loading states pour toutes les routes
- [ ] Google Analytics/Plausible configuré
- [ ] SEO : robots.txt, sitemap.xml (déjà configurés)
- [ ] Lighthouse score > 90 (audit avec `npm run audit:lighthouse`)
- [ ] Accessibilité : contrastes, focus, aria-labels

### Backend

- [ ] Migrer JWT de HS256 vers RS256 (recommandé pour architecture multi-service)
- [ ] Migrer le stockage de fichiers local vers S3/Cloudinary
- [ ] Webhook secrets (Stripe, FedaPay) vérifiés
- [ ] Tâches cron planifiées et testées
- [ ] File upload virus scanning (ClamAV recommandé)
- [ ] API versioning stable (déjà implémenté)

### Paiements

- [ ] Stripe en mode production (pas test mode)
- [ ] FedaPay en mode production
- [ ] Webhooks configurés dans les dashboards respectifs
- [ ] Escrow process validé
- [ ] Wallet transactions testées

### Tests

- [ ] Tests unitaires backend passent (`npm run test:backend`)
- [ ] Tests unitaires frontend passent (`npm run test:frontend`)
- [ ] Tests E2E Playwright passent (`npm run test:e2e`)
- [ ] Tests d'accessibilité passent (`npm run test:a11y`)
- [ ] Tests de charge k6 validés (`npm run k6:smoke`)
- [ ] Lighthouse audit > 90

## Déploiement

### Staging

```bash
# Pousser sur develop → CI build + déploiement staging automatique
git push origin develop
```

### Production

```bash
# Créer un tag version → CI build + déploiement production (approbation manuelle requise)
git tag v1.0.0
git push origin v1.0.0
```

Le workflow CI/CD (`.github/workflows/`) gère :
1. Build et push des images Docker vers GHCR
2. Déploiement staging automatique
3. Déploiement production avec approbation manuelle
4. Rollback possible depuis l'interface GitHub

## Architecture Multi-pays

AfriBiz supporte :
- **Multi-devise :** FCFA, NGN, GHS, XAF, MAD, EGP
- **Multi-langue :** Français (primaire), Anglais (secondaire)
- **Multi-paiement :** Mobile Money (TMoney, Flooz, Wave, Moov, Orange Money, MTN MoMo), Stripe, FedaPay
- **Multi-taxe :** ZLECAF, TVA par pays
- **Multi-unité :** Mesures africaines supportées