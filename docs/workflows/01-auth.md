# WORKFLOW 01 — AUTHENTIFICATION (État réel vérifié le 03/08/2026)

> ⚠️ Ce document reflète l'état RÉEL du code (vérifié par lecture de `backend/src`).
> La version précédente décrivait un état perdu au `git restore` — elle a été réécrite.

---

## 1. Flux actuel (ce qui existe VRAIMENT dans le code)

```
Client
  ↓
POST /auth/login  →  AuthService.login()          (services/auth.ts)
  ↓
UserRepository  ←── DB (vérif mdp, verrouillage 5 échecs, lastLoginAt ✅)
  ↓
SessionRepository + RefreshTokenRepository  ←── DB (session + refresh ✅)
  ↓
SecurityLogRepository  ←── DB (LOGIN / FAILED_LOGIN / ACCOUNT_LOCKED / LOGOUT ✅)
  ↓
JWT + refreshToken  →  Client
```

**Ce qui fonctionne déjà (à NE PAS toucher) :**
- ✅ Login / signup / logout / refresh / reset password / OTP / email verification
- ✅ 2FA TOTP + WebAuthn (partiel)
- ✅ Verrouillage après 5 échecs + journal sécurité (11 actions)
- ✅ Sessions + refresh tokens + révocation
- ✅ lastLoginAt / lastLoginIp mis à jour

---

## 2. 🚨 Ce qui est CASSÉ (vérifié dans le code)

| # | Manque | Preuve dans le code |
|---|---|---|
| 1 | **Aucun événement publié sur le bus** | `publishUserSignedUp`, `publishUserLoggedIn`, `publishPasswordChanged`, `publishAccountLocked`, `publishSecurityAlert`, `publishNewDeviceDetected` sont **définis** dans `events/publishers/auth.ts` mais **JAMAIS appelés** (0 usage hors définition). Le `NotificationService` a déjà la map `USER_LOGGED_IN → "Connexion détectée"` (l.82) — mais la notification **ne part jamais**. |
| 2 | **Aucun tracking Analytics** | `trackAnalyticsEvent` (chantier 1) n'est pas câblé sur l'auth : 0 événement `type:'auth'`. Les inscriptions/connexions sont **invisibles** dans la page realtime. |
| 3 | **`presenceService` ABSENT** | Le compteur « utilisateurs connectés » temps réel a été **perdu au git restore** (fichier introuvable). |
| 4 | **Data Hub auth-trends ABSENT** | `getAuthTrends` + route `/datahub/auth-trends` **perdus** (0 match). |
| 5 | **Pas d'événement logout** | `USER_LOGGED_OUT` n'existe même pas dans `events.ts`. |
| 6 | **Pas de détection nouveau dispositif** | `publishNewDeviceDetected` jamais appelé sur un login depuis un device inconnu. |

**Conséquence** : une connexion crée une session + un log… puis **s'arrête là**. Ni notification, ni analytics, ni compteur, ni Data Hub ne sont informés. L'effet « site statique » est total côté Auth.

---

## 3. Flux corrigé (cible)

```
Client
  ↓
POST /auth/login
  ↓
AuthService.login()
  ↓
UserRepository  ←── DB (vérif + lastLoginAt / lastLoginIp)
  ↓
SessionRepository + RefreshTokenRepository  ←── DB
  ↓
SecurityLog (LOGIN)  ←── DB
  ↓
⭐ publishUserLoggedIn({userId, device, location})  →  EventBus
  ↓
NotificationService  →  IN_APP « Connexion détectée »   (map déjà prête l.82)
  ↓
Socket `notification:new`  →  Frontend temps réel
  ↓
trackAnalyticsEvent({type:'auth', eventName:'LOGIN'})  →  AnalyticsEvent ←── DB
  ↓
presenceService.registerConnection()  →  broadcast `admin:presence:update`  →  room admin:dashboard
  ↓
Data Hub  →  getAuthTrends(30j)  →  carte « Activité authentification »
```

**Même flux pour les autres actions :**
```
INSCRIPTION   : publishUserSignedUp  → « Bienvenue 👋 » + Analytics + trackAnalyticsEvent
MOT DE PASSE  : publishPasswordChanged + publishSecurityAlert → « MDP modifié » + Analytics
VERROUILLAGE  : publishAccountLocked → « Alerte de sécurité » (map prête)
NOUVEAU DEVICE: publishNewDeviceDetected → « Nouvel appareil détecté » (map prête)
DÉCONNEXION   : publishUserLoggedOut (À CRÉER) → presenceService.removeConnection() + Analytics
2FA PASSÉE    : publishUserLoggedIn (device confirmé)
```

---

## 4. Relations créées (ce qui existe déjà en base)

| Relation | État | Détail |
|---|---|---|
| Auth → Journal sécurité | ✅ | 11 actions (SIGNUP, LOGIN, FAILED_LOGIN, ACCOUNT_LOCKED…) |
| Auth → Sessions | ✅ | session + refresh token + révocation |
| Auth → Emails | ✅ | bienvenue, reset, OTP, vérification |
| Auth → Dernière connexion | ✅ | lastLoginAt / lastLoginIp |
| Auth → Dashboard Admin | ✅ | adminService voit users + lastLoginAt + sessions + securityLogs |
| Auth → Verrouillage sécurité | ✅ | 5 échecs → lock |
| Auth → 2FA / WebAuthn | ✅ / ⚠️ | TOTP ✅, WebAuthn partiel |

---

## 5. Relations ABSENTES à créer (le cœur du chantier)

| # | Relation | Action |
|---|---|---|
| A | Auth → **EventBus** (publishers jamais appelés) | Appeler les publishers existants dans `services/auth.ts` (signup, login, logout, mdp, lock, device) + **créer** `publishUserLoggedOut` + `USER_LOGGED_OUT` dans `events.ts` |
| B | Auth → **Notifications** | Gratuit : la map existe déjà (l.82 `USER_LOGGED_IN → SECURITY_ALERT`) — se débloque dès que (A) est fait |
| C | Auth → **Analytics** (chantier 1) | `trackAnalyticsEvent` type `auth` : SIGNUP, LOGIN, LOGOUT, PASSWORD_CHANGED, ACCOUNT_LOCKED |
| D | Auth → **Compteur connectés temps réel** | Recréer `presenceService` (Map userId → sockets, multi-onglets) + broadcast `admin:presence:update` + route `GET /admin/presence` + hook frontend `useAdminPresence` |
| E | Auth → **Data Hub** | Recréer `getAuthTrends(30j)` (agrégation AnalyticsEvent type auth) + route `/datahub/auth-trends` |
| F | Auth → **Détection nouveau device** | Comparer device inconnu → `publishNewDeviceDetected` (device connu stocké en base) |

**Hors scope** (pas de nouvelles fonctionnalités) : Recommandations, CRM fiche client, Brief du matin — à traiter dans leurs workflows respectifs.

---

## 6. Plan d'implémentation (ordre logique)

1. **A** — Câbler les publishers dans `services/auth.ts` (signup/login/logout/mdp/lock) + créer `USER_LOGGED_OUT`
2. **C** — Ajouter `trackAnalyticsEvent` type `auth` (même fichier)
3. **D** — Recréer `presenceService.ts` (backend) + route admin + broadcast socket
4. **F** — Détection nouveau device (colonne device connus ou table)
5. **E** — `getAuthTrends` + route Data Hub
6. Frontend : hook `useAdminPresence` + bandeau admin (compteur connectés)
7. Tests (auth events, presence, analytics auth) + tsc + review + commit

---

*Fichier : docs/workflows/01-auth.md — état réel vérifié, format imposé par l'Architecte d'Intégration.*
