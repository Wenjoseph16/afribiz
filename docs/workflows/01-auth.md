# WORKFLOW 01 — AUTHENTIFICATION

> Format : organigramme. Chaque workflow documente le parcours de la donnée à travers toute la plateforme.

---

## 1. Flux actuel (avant correction)

```
Client
  ↓
POST /auth/login
  ↓
AuthService.login()  (vérification email/mdp, verrouillage 5 échecs)
  ↓
UserRepository  ←── DB (user, passwordHash, failedLoginAttempts)
  ↓
SessionRepository + RefreshTokenRepository  ←── DB
  ↓
SecurityLog (LOGIN)  ←── DB
  ↓
JWT + refreshToken  →  Client
```

**Résultat avant** : la connexion crée une session et un log… puis **s'arrête là**.
Ni notification, ni analytics, ni compteur, ni dashboard ne sont informés.

---

## 2. Flux corrigé (après correction)

```
Client
  ↓
POST /auth/login
  ↓
AuthService.login()
  ↓
UserRepository  ←── DB (vérif + lastLoginAt / lastLoginIp mis à jour)
  ↓
SessionRepository + RefreshTokenRepository  ←── DB
  ↓
SecurityLog (LOGIN)  ←── DB  (journal sécurité)
  ↓
⭐ publishUserLoggedIn()  →  EventBus
  ↓
NotificationService  →  IN_APP « Connexion détectée »
  ↓
Socket `notification:new`  →  Frontend temps réel
  ↓
trackAnalyticsEvent()  →  AnalyticsEvent  ←── DB
        (type: auth · category: navigation · « Connexion »)
  ↓
Dashboard Admin  →  totalUsers, liste users (lastLoginAt), actifs 7j
  ↓
CronService  →  détection comptes inactifs (basé sur lastLoginAt)
```

**Même flux pour les autres actions :**

```
INSCRIPTION      : publishUserSignedUp   → « Bienvenue » + Analytics
MOT DE PASSE     : publishPasswordChanged + publishSecurityAlert → « MDP modifié » + Analytics
VERROUILLAGE     : publishAccountLocked  → « Alerte de sécurité »
ROLE BUSINESS    : publishBusinessActivated → « Business activé »
ROLE DÉVELOPPEUR : publishDeveloperActivated → « Mode développeur »
```

---

## 3. Relations créées

| Relation | État |
|---|---|
| Auth → Notifications (6 événements) | ✅ |
| Auth → Analytics (signup/login/mdp) | ✅ |
| Auth → Journal sécurité (11 actions) | ✅ |
| Auth → Sessions (session + refresh token) | ✅ |
| Auth → Emails (bienvenue, reset, OTP, vérif) | ✅ |
| Auth → Dernière connexion (lastLoginAt/Ip) | ✅ |
| Auth → Dashboard Admin (totalUsers, liste) | ✅ |
| Auth → Verrouillage sécurité (5 échecs) | ✅ |
| Auth → 2FA (TOTP) | ✅ |
| Auth → WebAuthn (login biométrique) | ⚠️ partiel (vérif signature non implémentée) |
| Auth → CronService (inactivité des comptes) | ✅ |

---

## 4. Relations encore absentes

| Relation | État |
|---|---|
| Auth → Recommandations | ❌ (un nouvel utilisateur ne déclenche aucune reco) |
| Auth → CRM / fiche client | ❌ (la connexion ne crée pas de fiche client) |
| Auth → Brief du matin (Growth Engine) | ❌ (briefs générés par cron, pas alimentés par l'auth) |
| Auth → Compteur « utilisateurs connectés » temps réel | ✅ **implémenté** (presenceService + socket + REST + bandeau admin) |
| Auth → Data Hub | ✅ **implémenté** (getAuthTrends + carte « Activité authentification ») |

## 5. Mise à jour — relations implémentées ✅

**Compteur temps réel (→ Dashboard Admin) :**
```
Connexion Socket
  ↓
presenceService.registerConnection()  (Map userId → Set<socketId>, multi-onglets)
  ↓
Broadcast `admin:presence:update` (count + byRole)  →  room admin:dashboard
  ↓
useAdminPresence (frontend)  →  bandeau « X utilisateurs connectés » + chips par rôle
  ↓
GET /admin/presence (REST)  →  snapshot complet (avec liste users) pour l'état initial
```

**Data Hub alimenté par l'Auth :**
```
AuthService (signup/login)  →  AnalyticsEvent type='auth'
  ↓
dataHubAnalytics.getAuthTrends(30j)  →  agrégation par eventName + par jour
  ↓
GET /datahub/auth-trends (cache 300s)
  ↓
Page Data Hub  →  carte « Activité authentification (30 jours) » (KPIs + BarChart)
```

---

*Fichier : docs/workflows/01-auth.md — format imposé par l'Architecte d'Intégration.*
