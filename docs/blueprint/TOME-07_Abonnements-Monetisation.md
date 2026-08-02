# TOME-07 — Abonnements & Monétisation

> **Couche Business** — Plans, privilèges, souscriptions, commissions
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Monétiser la plateforme via des abonnements mensuels (Gratuit, Basic, Premium) et des commissions sur les transactions.

**Problème résolu :** Les businesses ont besoin de fonctionnalités adaptées à leur taille. Un petit commerçant n'a pas besoin d'un CRM avancé, une PME en pleine croissance a besoin de tout.

**Valeur ajoutée :**
- Modèle freemium : Gratuit + 1% par transaction
- Plans pré-définis avec privilèges granulaires
- Paiement Mobile Money pour les abonnements
- Commissions automatiques sur chaque transaction

---

## 2. Modèles de données

```
SubscriptionPlan {
  id                String                  @id @default(uuid())
  businessId        String?
  name              String                  // "Gratuit", "Basic", "Premium"
  description       String?
  type              SubscriptionPlanType    // FREE_TRIAL, STANDARD, PREMIUM
  price             Decimal                 @db.Decimal(12, 2)
  currency          String                  @default("FCFA")
  billingCycle      BillingCycle            // MONTHLY, YEARLY
  trialDays         Int?
  durationDays      Int?
  maxUsage          Int?
  maxClients        Int?
  maxBookings       Int?
  benefits          String[]
  isPublic          Boolean                 @default(true)
  isActive          Boolean                 @default(true)
  sortOrder         Int                     @default(0)
  featured          Boolean                 @default(false)
  badge             String?                 // "POPULAIRE", "BEST SELLER"
  business          Business?
  privileges        SubscriptionPrivilege[]
  subscriptions     BusinessSubscription[]
  logs              SubscriptionLog[]
}

SubscriptionPrivilege {
  id          String    @id @default(uuid())
  planId      String
  code        String    // ex: "MAX_PRODUCTS", "CRM_ENABLED", "AI_COPILOT"
  label       String    // ex: "Produits illimités"
  description String?
  value       String?   // ex: "100", "true"
  valueType   String?   // NUMBER, BOOLEAN, TEXT
  sortOrder   Int       @default(0)
  plan        SubscriptionPlan
}

BusinessSubscription {
  id                String              @id @default(uuid())
  businessId        String
  planId            String
  clientId          String?             // Client qui a payé (si différent)
  status            SubscriptionStatus  // ACTIVE, CANCELLED, EXPIRED, TRIALING
  startDate         DateTime
  endDate           DateTime?
  cancelledAt       DateTime?
  cancelReason      String?
  autoRenew         Boolean             @default(true)
  renewalStatus     String?
  renewalCount      Int                 @default(0)
  lastRenewedAt     DateTime?
  nextBillingDate   DateTime?
  business          Business
  plan              SubscriptionPlan
  client            User?               @relation("ClientSubscriptions")
  payments          SubscriptionPayment[]
  logs              SubscriptionLog[]
}
```

### Commissions

```
CommissionConfig {
  id          String    @id @default(uuid())
  key         String    @unique
  label       String
  description String?
  rate        Float     // 0.01 = 1%
  scope       String?   // global, business, category
  scopeValue  String?
  minFee      Decimal?  @db.Decimal(12, 2)
  maxFee      Decimal?  @db.Decimal(12, 2)
  currency    String    @default("FCFA")
  isActive    Boolean   @default(true)
}
```

---

## 3. Plans et privilèges

### Plan Gratuit (0 FCFA/mois)

| Privilège | Valeur |
|-----------|--------|
| Profil public | ✓ |
| Produits/Services | 3 max |
| Commandes manuelles | ✓ |
| Paiement Mobile Money | ✓ |
| Support email | ✓ |
| Commission par transaction | 1% |

### Plan Basic (À définir FCFA/mois)

| Privilège | Valeur |
|-----------|--------|
| Tout le plan Gratuit | ✓ |
| Produits/Services | Illimité |
| Réservations en ligne | ✓ |
| Promotions & coupons | ✓ |
| Statistiques avancées | ✓ |
| Gestion employés | ✓ |
| Support prioritaire | ✓ |
| Commission par transaction | 1% |

### Plan Premium (À définir FCFA/mois)

| Privilège | Valeur |
|-----------|--------|
| Tout le plan Basic | ✓ |
| Marketplace développeur | ✓ |
| Copilot IA | ✓ |
| CRM complet | ✓ |
| Paiement par lots | ✓ |
| API dédiée | ✓ |
| Support 24/7 | ✓ |
| Account manager dédié | ✓ |
| Commission par transaction | 0.5% |

---

## 4. Règles métier

- **RB-01** : Le plan Gratuit est le plan par défaut à l'inscription
- **RB-02** : Les privilèges sont vérifiés à chaque action (middleware)
- **RB-03** : Si un abonnement expire → retour au plan Gratuit
- **RB-04** : Une période d'essai (trial) de 14 jours est possible sur les plans payants
- **RB-05** : Commission transaction = rate × montant, prélevée automatiquement
- **RB-06** : Les plans sont configurables par l'admin (feature flags + settings)

---

## 5. Critères d'acceptation

| AC | Critère |
|----|---------|
| AC-07-01 | Inscription → plan Gratuit attribué par défaut |
| AC-07-02 | Upgrade Basic → privilèges débloqués |
| AC-07-03 | Expiration abonnement → retour Gratuit |
| AC-07-04 | Privilège vérifié avant action (ex: max produits) |
| AC-07-05 | Commission calculée et prélevée automatiquement |
| AC-07-06 | Paiement abonnement via Mobile Money |
| AC-07-07 | Admin peut modifier plans et prix |