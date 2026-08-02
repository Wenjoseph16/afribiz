# TOME-01 — Authentification, Sécurité & Onboarding

> **Couche Fondation** — Parcours utilisateur d'entrée sur la plateforme
> Statut : Référence | Priorité : Critique

---

## 1. Objectifs métier

Permettre à tout utilisateur (Business, Client, Développeur, Admin) de créer un compte, s'authentifier de manière sécurisée, et terminer son onboarding avec le minimum de frictions possible.

**Problème résolu :** En Afrique, le taux d'abandon à l'inscription est élevé à cause des formulaires longs, de l'absence d'authentification par téléphone, et de la méfiance envers les plateformes en ligne.

**Valeur ajoutée :**
- Inscription en 3 clics (email OU téléphone)
- Mobile Money et téléphone comme identifiants principaux
- 2FA optionnelle, WebAuthn pour les profils sensibles
- Onboarding progressif : on commence par l'essentiel, on complète plus tard

---

## 2. Modèles de données

### User
```
User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  phone                 String?   @unique
  firstName             String?
  lastName              String?
  passwordHash          String
  emailVerified         Boolean   @default(false)
  phoneVerified         Boolean   @default(false)
  isActive              Boolean   @default(true)
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?
  lastLoginAt           DateTime?
  lastLoginIp           String?
  avatar                String?
  country               String?
  region                String?
  city                  String?
  neighborhood          String?
  birthDate             DateTime?
  gender                String?
  businessName          String?
  businessRegistration  String?
  developerApiKey       String?
  twoFactorEnabled      Boolean   @default(false)
  twoFactorSecret       String?
  twoFactorBackupCodes  String?
  rememberMeToken       String?
  developerVerificationStatus DeveloperVerificationStatus?
  primaryRole           UserRole  @default(CLIENT)
  roles                 UserRole[]
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  deletedAt             DateTime?

  // Relations
  sessions              Session[]
  refreshTokens         RefreshToken[]
  passwordResets        PasswordReset[]
  emailVerifications    EmailVerification[]
  otpCodes              OtpCode[]
  securityLogs          SecurityLog[]
  devices               Device[]
  notifications         Notification[]
  notificationPrefs     NotificationPreference[]
  business              Business?
  developerProfile      DeveloperProfile?
  ...
}
```

### Session
```
Session {
  id          String    @id @default(uuid())
  userId      String
  userAgent   String?
  ipAddress   String?
  deviceId    String?
  isActive    Boolean   @default(true)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  revokedAt   DateTime?
  user        User      @relation(fields: [userId], references: [id])
  device      Device?   @relation(fields: [deviceId], references: [id])
}
```

### RefreshToken
```
RefreshToken {
  id          String    @id @default(uuid())
  userId      String
  token       String    @unique
  sessionId   String?
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
}
```

### OTP / 2FA / Devices / Security
- **OtpCode** : id, userId, code, type (EMAIL|SMS|TWOFA), destination, attempts, maxAttempts, expiresAt, verifiedAt
- **Device** : id, userId, name, deviceType, osType, browserName, ipAddress, userAgent, isCurrentDevice, isTrusted, lastVerifiedAt, trustExpiresAt
- **SecurityLog** : id, userId, action (LOGIN|LOGOUT|SIGNUP|FAILED_LOGIN|ACCOUNT_LOCKED...), ipAddress, success, reason, metadata
- **PasswordReset** : id, userId, token (unique), expiresAt, usedAt
- **EmailVerification** : id, userId, token (unique), email, expiresAt, verifiedAt
- **RevokedToken** : id, jti (unique), userId, reason, exp
- **WebAuthnCredential** : id, userId, credentialId (unique), publicKey, counter, deviceName, backedUp
- **FraudRule** : id, name, type, config (JSON), isActive, priority, action, severity
- **FraudEvent** : id, userId?, businessId?, ruleId?, ruleName, eventType, severity, action, blocked, metadata
- **AdminKyc** : id, userId (unique), identityDocument, identityType, identityNumber, verificationStatus, rejectionReason

---

## 3. Parcours utilisateur

### 3.1 Inscription (Signup)

```
Étape 1 : Choix du rôle
  └─ Je suis un : [Business] [Client] [Développeur]

Étape 2 : Identité
  └─ Email OU Téléphone (Mobile Money)
  └─ Mot de passe (avec indicateur de force)
  └─ Nom / Prénom

Étape 3 : Vérification
  └─ Si email → lien de vérification envoyé
  └─ Si téléphone → code OTP envoyé par SMS/WhatsApp
  └─ L'utilisateur peut commencer sans vérifier, avec restrictions levées après vérification

Cas particulier : Inscription via Google/Apple
  └─ OAuth : Google ou Apple
  └─ Pas de mot de passe → création d'un mot de passe à la première connexion
  └─ Email auto-vérifié

Cas particulier : Inscription comme Business
  └─ Après signup → redirection vers le wizard d'onboarding
  └─ Création auto du profil Business
  └─ Activation des modules par défaut

Cas particulier : Inscription comme Développeur
  └─ Après signup → redirection vers le profil développeur
  └─ Vérification requise pour publier des modules
```

### 3.2 Connexion (Login)

```
Étape 1 : Identifiant
  └─ Email OU Téléphone

Étape 2 : Mot de passe
  └─ Vérification du hash bcrypt
  └─ Si failedLoginAttempts > 5 → compte temporairement verrouillé

Étape 3 : 2FA (si activée)
  └─ TOTP via Google Authenticator / Authy
  └─ Ou code de secours (backup codes)
  └─ Ou WebAuthn (biométrique)

Étape 4 : Device Trust
  └─ Option "Se souvenir de cet appareil" → trust cookie 30 jours
  └─ Nouvel appareil → notification email + log de sécurité

Étape 5 : Session
  └─ Access token (JWT, 15 min)
  └─ Refresh token (JWT, 7 jours, stocké en httpOnly cookie)
  └─ Session créée en base

Cas particulier : "Remember Me"
  └─ Refresh token 30 jours au lieu de 7
  └─ Pas de 2FA pour 24h sur cet appareil

Cas particulier : Connexion échouée
  └─ Incrément failedLoginAttempts
  └─ Après 5 échecs : lockedUntil = now + 15 min
  └─ Après 10 échecs en 24h : notification admin + vérification renforcée
  └─ SecurityLog créé à chaque échec
```

### 3.3 Réinitialisation de mot de passe

```
Étape 1 : Demande
  └─ Saisie email ou téléphone

Étape 2 : Envoi du lien/code
  └─ Si email : lien unique (expire 1h)
  └─ Si téléphone : code OTP (expire 10 min)

Étape 3 : Saisie nouveau mot de passe
  └─ Validation force (min 8 car, maj, chiffre)
  └─ Hash et sauvegarde
  └─ Révocation de tous les refresh tokens
  └─ Notification email/WhatsApp "Votre mot de passe a été changé"
```

### 3.4 Onboarding Business (Wizard)

```
Étape 1 : Informations de base
  └─ Nom du business, slug (auto-généré + modifiable)
  └─ Type d'activité (BusinessType : RESTAURANT, BOUTIQUE, SERVICE...)
  └─ Pays, ville, téléphone, email

Étape 2 : Modules
  └─ Sélection des modules à activer :
    [ ] Commandes en ligne
    [ ] Réservations
    [ ] Menu / Cartes
    [ ] Services / Prestations
    [ ] Chambres / Hébergement
    [ ] Locations
    [ ] Événements
    [ ] Livraison
    [ ] Portfolio
    [ ] Formations
    (sélection par défaut basée sur le BusinessType)

Étape 3 : Paiement
  └─ Compte Mobile Money pour recevoir les paiements
  └─ Wave, TMoney, Flooz, Moov Money, Orange Money
  └─ Option Stripe (si disponible dans le pays)

Étape 4 : Résumé
  └─ Récapitulatif des informations
  └─ Confirmation et activation

Cas particulier : Onboarding incomplet
  └─ L'utilisateur peut fermer le wizard et y revenir plus tard
  └─ Le profil est en mode "brouillon" → pas visible publiquement
  └─ Une notification de rappel est envoyée après 24h, 72h, 7j
```

---

## 4. Routes API

### Auth

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| POST | `/api/auth/signup` | authLimiter | Inscription |
| POST | `/api/auth/login` | authLimiter, loginRateLimit | Connexion |
| POST | `/api/auth/logout` | authMiddleware | Déconnexion (révocation tokens) |
| POST | `/api/auth/refresh` | — | Rafraîchir access token |
| POST | `/api/auth/forgot-password` | authLimiter | Demander réinitialisation |
| POST | `/api/auth/reset-password` | authLimiter | Réinitialiser mot de passe |
| POST | `/api/auth/change-password` | authMiddleware | Changer mot de passe |
| POST | `/api/auth/verify-email` | — | Vérifier email (token) |
| POST | `/api/auth/resend-verification` | resendLimiter | Renvoyer email de vérification |
| POST | `/api/auth/send-otp` | resendLimiter | Envoyer code OTP |
| POST | `/api/auth/verify-otp` | — | Vérifier code OTP |
| GET | `/api/auth/me` | authMiddleware | Profil utilisateur courant |
| PUT | `/api/auth/me` | authMiddleware | Mettre à jour profil |
| DELETE | `/api/auth/me` | authMiddleware | Supprimer compte |
| GET | `/api/auth/sessions` | authMiddleware | Lister sessions actives |
| DELETE | `/api/auth/sessions/:id` | authMiddleware | Révoquer une session |
| GET | `/api/auth/devices` | authMiddleware | Appareils enregistrés |
| DELETE | `/api/auth/devices/:id` | authMiddleware | Révoquer un appareil |
| POST | `/api/auth/2fa/setup` | authMiddleware | Activer 2FA (génère secret) |
| POST | `/api/auth/2fa/verify` | authMiddleware | Vérifier code 2FA + finaliser setup |
| POST | `/api/auth/2fa/disable` | authMiddleware, 2FA | Désactiver 2FA |
| POST | `/api/auth/2fa/recovery` | authMiddleware | Régénérer codes de secours |
| GET | `/api/auth/webauthn/register` | authMiddleware | Initier WebAuthn registration |
| POST | `/api/auth/webauthn/register` | authMiddleware | Finaliser WebAuthn registration |
| POST | `/api/auth/webauthn/login` | — | Authentifier avec WebAuthn |

### Onboarding

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/api/onboarding/steps` | authMiddleware | État d'avancement onboarding |
| POST | `/api/onboarding/step1` | authMiddleware | Étape 1 : infos business |
| POST | `/api/onboarding/step2` | authMiddleware | Étape 2 : sélection modules |
| POST | `/api/onboarding/step3` | authMiddleware | Étape 3 : moyen de paiement |
| POST | `/api/onboarding/complete` | authMiddleware | Finaliser onboarding |
| GET | `/api/onboarding/progress` | authMiddleware | % complétion + prochaine étape |

### Sécurité (Admin)

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/api/auth/admin/security-logs` | auth, ADMIN | Logs de sécurité |
| GET | `/api/auth/admin/fraud-events` | auth, ADMIN | Événements de fraude |
| POST | `/api/auth/admin/fraud-rules` | auth, ADMIN | Créer règle anti-fraude |
| PUT | `/api/auth/admin/fraud-rules/:id` | auth, ADMIN | Modifier règle |
| POST | `/api/auth/admin/kyc/verify/:userId` | auth, ADMIN | Vérifier KYC admin |

---

## 5. Pages & Composants

### Pages publiques (auth)

| Page | Route | Composant principal |
|------|-------|-------------------|
| Connexion | `/login` | `app/(auth)/login/page.tsx` |
| Inscription | `/signup` | `app/(auth)/signup/page.tsx` |
| Mot de passe oublié | `/forgot-password` | `app/(auth)/forgot-password/page.tsx` |
| Réinitialisation | `/reset-password` | `app/(auth)/reset-password/page.tsx` |
| Vérification email | `/verify-email` | `app/(auth)/verify-email/page.tsx` |
| Layout auth | — | `app/(auth)/layout.tsx` (AuthLayout) |

### Composants auth

| Composant | Rôle |
|-----------|------|
| `AuthGuard` | Route protégée — redirige vers `/login` si non connecté |
| `AuthLayout` | Layout des pages auth (slider, logo, formulaire) |
| `AuthSlider` | Slider de fond avec visuels et accroches |
| `AuthSocialButtons` | Boutons Google, Apple |
| `FormInput` | Input stylisé avec label, erreur, icône |
| `PhoneInput` | Input téléphone avec indicatif pays |
| `OtpInput` | Champ code OTP (6 chiffres, auto-focus) |
| `PasswordStrengthMeter` | Indicateur de force du mot de passe |
| `LocationSelect` | Sélecteur pays+ville |

### Pages dashboard (onboarding)

| Page | Route |
|------|-------|
| Onboarding Wizard | `/dashboard/onboarding` |
| Devenir Business | `/dashboard/become-business` |
| Devenir Développeur | `/dashboard/become-developer` |
| Profil | `/dashboard/profile` |
| Sécurité | `/dashboard/security` |

---

## 6. Règles métier

### Inscription
- **RB-01** : Email unique. Si déjà utilisé, refus avec message "Cet email est déjà utilisé"
- **RB-02** : Téléphone unique. Si déjà utilisé, refus
- **RB-03** : Mot de passe minimum 8 caractères, 1 majuscule, 1 chiffre
- **RB-04** : L'utilisateur peut s'inscrire sans vérifier son email/téléphone
- **RB-05** : Un compte non vérifié ne peut pas :
  - Publier de produits/services (si Business)
  - Activer la 2FA
  - Demander un payout (si Développeur)

### Connexion
- **RB-06** : 5 tentatives échouées → verrouillage 15 minutes
- **RB-07** : 10 tentatives échouées en 24h → alerte admin + vérification renforcée
- **RB-08** : Token JWT access : 15 minutes d'expiration
- **RB-09** : Refresh token : 7 jours, stocké en httpOnly cookie sécurisé
- **RB-10** : Un refresh token ne peut être utilisé qu'une seule fois (rotation)
- **RB-11** : À la déconnexion, révocation de tous les refresh tokens de la session

### 2FA
- **RB-12** : L'activation 2FA nécessite un email vérifié
- **RB-13** : Codes de secours : 8 codes à usage unique, régénérables
- **RB-14** : En cas de perte du 2FA, récupération via :
  1. Code de secours
  2. Email de récupération (avec vérification renforcée)
  3. Contact support admin (après KYC)

### Sessions / Devices
- **RB-15** : Maximum 10 sessions actives par utilisateur
- **RB-16** : À l'ajout d'un nouvel appareil, notification envoyée
- **RB-17** : Un appareil "trusté" ne nécessite pas 2FA pendant 30 jours
- **RB-18** : Les sessions expirent après 30 jours d'inactivité

### Onboarding
- **RB-19** : L'onboarding peut être interrompu et repris
- **RB-20** : Le profil business en "brouillon" n'est pas visible publiquement
- **RB-21** : Les modules par défaut dépendent du BusinessType :
  - RESTAURANT → Menu, Commandes, Réservations
  - BOUTIQUE → Produits, Commandes
  - SERVICE → Services, Réservations
  - HOTEL → Chambres, Réservations
- **RB-22** : Relance onboarding après 24h, 72h, 7j (max 3 relances)

---

## 7. Permissions & Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| **GUEST** | Non connecté | Pages publiques uniquement |
| **CLIENT** | Utilisateur standard | Achat, réservation, profil |
| **BUSINESS** | Commerçant/prestataire | Dashboard business, gestion catalogue, commandes |
| **DEVELOPER** | Créateur de modules | Marketplace développeur, publications |
| **ADMIN** | Super administrateur | Tout accès, gestion plateforme |

| Rôle | Signup | Login | 2FA | Onboarding | Sessions | Admin |
|------|--------|-------|-----|------------|----------|-------|
| GUEST | — | — | — | — | — | — |
| CLIENT | ✓ | ✓ | ✓ | — | ✓ | — |
| BUSINESS | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| DEVELOPER | ✓ | ✓ | ✓ | — | ✓ | — |
| ADMIN | ✓ | ✓ | ✓ | ✓ | Tous | ✓ |

**Cas particulier :** Un utilisateur peut cumuler plusieurs rôles (ex: BUSINESS + CLIENT, DEVELOPER + CLIENT). Les rôles sont stockés dans le tableau `roles[]` sur User.

---

## 8. Notifications

| Événement | Canal | Template |
|-----------|-------|----------|
| `SIGNUP` | Email | "Bienvenue sur AfriBiz ! Confirmez votre email" |
| `SIGNUP` | SMS/WhatsApp | "Votre code de vérification AfriBiz : {code}" |
| `LOGIN_NEW_DEVICE` | Email | "Nouvelle connexion sur {device}" |
| `FAILED_LOGIN` | Email | "Tentative de connexion échouée" (seuil : 3+) |
| `ACCOUNT_LOCKED` | Email | "Compte verrouillé pour 15 minutes" |
| `PASSWORD_CHANGE` | Email | "Votre mot de passe a été modifié" |
| `PASSWORD_RESET` | Email | "Votre mot de passe a été réinitialisé" |
| `2FA_ENABLED` | Email | "Authentification à deux facteurs activée" |
| `2FA_DISABLED` | Email | "Authentification à deux facteurs désactivée" |
| `ONBOARDING_REMINDER` | Email | "Vous n'avez pas terminé votre inscription" |
| `ONBOARDING_COMPLETE` | Email | "Félicitations ! Votre profil est en ligne" |
| `ACCOUNT_DELETED` | Email | "Votre compte AfriBiz a été supprimé" |

---

## 9. Automatisations

| Règle | Déclencheur | Action |
|-------|------------|--------|
| **Relance onboarding** | 24h après signup si onboarding < 100% | Email + notification in-app |
| **Verrouillage sécurité** | 5 failed login en < 15 min | lockUntil = now + 15 min |
| **Alerte admin** | 10 failed login en 24h sur un compte | Notification admin + log fraude |
| **Nettoyage tokens** | Quotidien (cron) | Suppression refresh tokens expirés |
| **Nettoyage sessions** | Quotidien (cron) | Expiration sessions inactives > 30j |
| **Nettoyage OTP** | Toutes les heures (cron) | Suppression codes OTP expirés |

---

## 10. Critères d'acceptation

| AC | Critère | Test |
|----|---------|------|
| AC-01-01 | Un nouvel utilisateur peut s'inscrire avec email | Inscription → email de vérification reçu |
| AC-01-02 | Un nouvel utilisateur peut s'inscrire avec téléphone | Inscription → OTP reçu par SMS |
| AC-01-03 | L'inscription avec email déjà utilisé échoue | HTTP 409 "Email déjà utilisé" |
| AC-01-04 | L'inscription avec téléphone déjà utilisé échoue | HTTP 409 "Téléphone déjà utilisé" |
| AC-01-05 | La connexion avec identifiants valides retourne tokens | HTTP 200 + accessToken + refreshToken |
| AC-01-06 | La connexion avec mauvais mot de passe échoue | HTTP 401 + incrément failedLoginAttempts |
| AC-01-07 | Après 5 échecs, le compte est verrouillé 15 min | HTTP 423 + lockedUntil |
| AC-01-08 | Le refresh token fait pivoter | Ancien refresh token révoqué, nouveau émis |
| AC-01-09 | La 2FA est activable avec email vérifié | Setup → QR code → code TOTP valide |
| AC-01-10 | La 2FA est requise à la connexion si activée | Connexion → écran 2FA → dashboard |
| AC-01-11 | L'onboarding peut être interrompu et repris | Étape 1 → fermeture → reprise étape 1 |
| AC-01-12 | Les sessions actives sont listables | GET /api/auth/sessions → tableau |
| AC-01-13 | Une session peut être révoquée | DELETE → refresh token invalide |
| AC-01-14 | La déconnexion révoque tous les tokens | POST /logout → accès refusé |
| AC-01-15 | Le KYC admin peut être soumis et vérifié | Upload documents → admin vérifie → statut mis à jour |
| AC-01-16 | Les device trust fonctionnent (30 jours sans 2FA) | Login avec trust → pas de 2FA pendant 30j |
| AC-01-17 | WebAuthn fonctionne (registration + login) | Register biometric → login with biometric |