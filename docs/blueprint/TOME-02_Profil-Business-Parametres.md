# TOME-02 — Profil Business & Paramètres

> **Couche Business** — Cœur du compte professionnel
> Statut : Référence | Priorité : Critique

---

## 1. Objectifs métier

Permettre à tout professionnel (commerçant, artisan, prestataire) de créer et gérer sa vitrine numérique complète : informations, visuels, horaires, moyens de paiement, modules activés, vérification.

**Problème résolu :** Un business doit pouvoir être trouvé, contacté, et évalué par des clients. Sa page publique est son "site web" sans avoir à coder.

**Valeur ajoutée :**
- Page publique personnalisable (slug unique)
- Modules activables à la carte
- Vérification officielle (documents légaux)
- SEO intégré

---

## 2. Modèles de données

### Business
```
Business {
  id                String        @id @default(uuid())
  ownerId           String        @unique
  name              String
  slug              String        @unique
  type              BusinessType  // RESTAURANT, BOUTIQUE, SERVICE, HOTEL, etc.
  modules           String[]      // Module codes activés
  description       String?
  shortDescription  String?
  email             String?
  phone             String?
  website           String?
  logo              String?
  coverImage        String?
  country           String?
  city              String?
  region            String?
  address           String?
  latitude          Float?
  longitude         Float?
  googleMapsLink    String?
  tagline           String?
  seoTitle          String?
  seoDescription    String?
  socialLinks       Json?         // { whatsapp, facebook, instagram, twitter, ... }
  whatsapp          String?
  facebook          String?
  instagram         String?
  twitter           String?
  linkedin          String?
  tiktok            String?
  youtube           String?
  mission           String?
  vision            String?
  values            String?
  foundedYear       Int?
  employeeCount     Int?
  rating            Float         @default(0)
  reviewCount       Int           @default(0)
  isActive          Boolean       @default(true)
  isVerified        Boolean       @default(false)
  isPremium         Boolean       @default(false)
  premiumSince      DateTime?
  premiumUntil      DateTime?
  isNew             Boolean       @default(true)
  isTopSeller       Boolean       @default(false)
  isTopProvider     Boolean       @default(false)
  isRecommended     Boolean       @default(false)
  isNew             Boolean       @default(true)
  // Vérification
  verificationStatus VerificationStatus?
  identityDocument  String?
  companyDocument   String?
  taxDocument       String?
  responsiblePhoto  String?
  verifiedAt        DateTime?
  verificationLevel Int?
  verifiedBy        String?
  rejectionReason   String?
  // Propriétaire
  owner             User          @relation(fields: [ownerId], references: [id])
}
```

### BusinessSettings
```
BusinessSettings {
  id                      String   @id @default(uuid())
  businessId              String   @unique
  currency                String   @default("FCFA")
  timezone                String   @default("Africa/Abidjan")
  language                String   @default("fr")
  dateFormat              String   @default("DD/MM/YYYY")
  autoConfirmBookings     Boolean  @default(false)
  autoConfirmOrders       Boolean  @default(false)
  allowOnlinePayments     Boolean  @default(true)
  allowCashOnDelivery     Boolean  @default(true)
  requirePhoneForOrders   Boolean  @default(true)
  notificationEmail       String?
  notificationPhone       String?
  notifyNewOrders         Boolean  @default(true)
  notifyNewBookings       Boolean  @default(true)
  notifyNewReviews        Boolean  @default(true)
  business                Business @relation(fields: [businessId], references: [id])
}
```

### Autres modèles liés
- **BusinessHour** : id, businessId, day, open, close, isClosed
- **BusinessPaymentMethod** : id, businessId, method (WAVE|TMONEY|FLOOZ|MOOV|ORANGE|STRIPE), name, number, nameOnAccount, isActive
- **BusinessModuleAssignment** : id, businessId, module (BusinessModule), config (Json), status, activatedAt
- **BusinessReview** : id, businessId, userId, rating, title, comment, response, responseAt, isActive
- **BusinessTag** : id, businessId, name, color

---

## 3. Parcours utilisateur

### 3.1 Création du profil (via onboarding ou direct)

```
Étape 1 : Informations générales
  └─ Nom du business
  └─ Slug (vérification disponibilité, suggestions auto)
  └─ Type d'activité (liste déroulante)
  └─ Description courte (max 160 car)
  └─ Logo + photo de couverture

Étape 2 : Coordonnées
  └─ Email, téléphone, site web
  └─ WhatsApp (numéro dédié business)
  └─ Réseaux sociaux (Facebook, Instagram, Twitter, TikTok, LinkedIn, YouTube)
  └─ Adresse : pays, ville, quartier, Google Maps

Étape 3 : Horaires
  └─ Jours d'ouverture/fermeture
  └─ Horaires par jour (open/close)
  └─ Possibilité de fermeture exceptionnelle

Étape 4 : Paiement
  └─ Comptes Mobile Money (Wave, TMoney, Flooz, Moov Money, Orange Money)
  └─ Compte bancaire (si Stripe disponible)
  └─ Chaque compte est vérifié par un micro-paiement

Étape 5 : Modules
  └─ Sélection des fonctionnalités à activer
```

### 3.2 Vérification du compte

```
Parcours Admin :
  1. Le business soumet ses documents (pièce d'identité, registre de commerce, photo responsable)
  2. L'admin reçoit une notification
  3. L'admin vérifie les documents dans le panneau admin
  4. Statut mis à jour : VERIFIED ou REJECTED + motif
  5. Notification au business du résultat
  6. Si vérifié : badge "Vérifié" sur la page publique
```

### 3.3 Page publique business

```
Structure de la page publique /business/[slug] :
  └─ Header : logo, nom, tagline, CTA (contacter, commander)
  └─ Sections activées selon les modules (voir TOME-28)
  └─ Footer : coordonnées, horaires, réseaux sociaux
```

---

## 4. Routes API

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/api/business` | auth, BUSINESS | Mon profil business |
| POST | `/api/business` | auth, BUSINESS | Créer profil business |
| PUT | `/api/business` | auth, BUSINESS | Mettre à jour profil |
| PUT | `/api/business/settings` | auth, BUSINESS | Mettre à jour paramètres |
| GET | `/api/business/settings` | auth, BUSINESS | Lire paramètres |
| PUT | `/api/business/hours` | auth, BUSINESS | Mettre à jour horaires |
| GET | `/api/business/hours` | auth, BUSINESS | Lire horaires |
| PUT | `/api/business/payment-methods` | auth, BUSINESS | Ajouter/modifier moyen paiement |
| DELETE | `/api/business/payment-methods/:id` | auth, BUSINESS | Supprimer moyen paiement |
| POST | `/api/business/modules/activate` | auth, BUSINESS | Activer un module |
| POST | `/api/business/modules/deactivate` | auth, BUSINESS | Désactiver un module |
| GET | `/api/business/verification` | auth, BUSINESS | Statut vérification |
| POST | `/api/business/verification` | auth, BUSINESS | Soumettre documents |
| PUT | `/api/business/verification/status` | auth, ADMIN | Mettre à jour statut vérification |
| GET | `/api/business/tags` | auth, BUSINESS | Tags du business |
| POST | `/api/business/tags` | auth, BUSINESS | Ajouter un tag |
| DELETE | `/api/business/tags/:id` | auth, BUSINESS | Supprimer un tag |
| GET | `/api/business/public/:slug` | — | Page publique business |

---

## 5. Pages & Composants

### Pages dashboard

| Page | Route |
|------|-------|
| Dashboard business | `/dashboard/business` |
| Paramètres | `/dashboard/business/settings` |
| Modules | `/dashboard/business/modules` |
| Vérification | `/dashboard/business/verification` |
| Abonnement | `/dashboard/business/subscription` |
| Messages | `/dashboard/business/messages` |
| Templates notif | `/dashboard/business/notification-templates` |

### Composants spécifiques

| Composant | Rôle |
|-----------|------|
| `business-public/BusinessPage` | Page publique business (orchestrateur de sections) |
| `business-public/Header` | Header page publique (logo, nav, CTA) |
| `business-public/Footer` | Footer page publique (coordonnées, horaires, réseaux) |
| `business-public/InternalNav` | Navigation interne des sections |
| `business-public/TrustBadges` | Badges vérifié/premium |
| `business-public/SocialStats` | Statistiques réseaux sociaux |
| `business-public/Banner` | Bannière promotionnelle |

---

## 6. Règles métier

- **RB-01** : Le slug doit être unique, lisible, sans caractères spéciaux
- **RB-02** : Un business ne peut avoir qu'un propriétaire (ownerId unique)
- **RB-03** : Les modules activables sont définis par SubscriptionPlan
- **RB-04** : Un business non vérifié ne peut pas :
  - Être "Top Seller" ou "Top Provider"
  - Voir son AfriScore calculé
  - Accéder au marketplace développeur
- **RB-05** : Le rating est la moyenne des BusinessReview (calculée périodiquement)
- **RB-06** : isNew = true pendant 30 jours après la création
- **RB-07** : La suppression du profil business met deletedAt, n'efface pas la ligne

---

## 7. Permissions & Rôles

| Action | GUEST | CLIENT | BUSINESS | DEVELOPER | ADMIN |
|--------|-------|--------|----------|-----------|-------|
| Voir page publique | ✓ | ✓ | ✓ | ✓ | ✓ |
| Créer profil | — | — | ✓ | — | — |
| Modifier profil | — | — | ✓ | — | ✓ |
| Gérer modules | — | — | ✓ | — | ✓ |
| Vérifier documents | — | — | — | — | ✓ |
| Gérer tous les profils | — | — | — | — | ✓ |

---

## 8. Notifications

| Événement | Canal | Template |
|-----------|-------|----------|
| Profil créé | In-app | "Votre profil {name} est en ligne !" |
| Vérification soumise | In-app + Email | "Vos documents ont été reçus, vérification en cours" |
| Vérification approuvée | In-app + Email | "Votre compte est vérifié ! Badge attribué" |
| Vérification refusée | In-app + Email | "Vérification refusée : {raison}" |
| Nouvel avis | In-app + Email | "Nouvel avis de {client}" |
| Module activé | In-app | "Module {name} activé" |
| Module désactivé | In-app | "Module {name} désactivé" |

---

## 9. Automatisations

| Règle | Déclencheur | Action |
|-------|------------|--------|
| Calcul rating | Quotidien (cron) | Recalcul rating = moyenne des reviews |
| Expiration isNew | Quotidien (cron) | isNew = false après 30 jours |
| Relance vérification | 7 jours après création si non vérifié | Notification "Passez en compte vérifié" |

---

## 10. Critères d'acceptation

| AC | Critère |
|----|---------|
| AC-02-01 | Création profil → slug unique, page publique accessible |
| AC-02-02 | Modification paramètres → mise à jour immédiate |
| AC-02-03 | Activation module → nouvelle section sur page publique |
| AC-02-04 | Désactivation module → section cachée |
| AC-02-05 | Horaires → affichés sur page publique |
| AC-02-06 | Moyens paiement → listés et masqués (infos sensibles) |
| AC-02-07 | Vérification soumise → admin notifié |
| AC-02-08 | Vérification approuvée → badge visible |
| AC-02-09 | Vérification refusée → motif visible pour le business |
| AC-02-10 | Page publique responsive, SEO-friendly |