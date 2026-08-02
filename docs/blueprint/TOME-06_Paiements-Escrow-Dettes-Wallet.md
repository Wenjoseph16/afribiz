# TOME-06 — Paiements, Escrow, Dettes & Wallet

> **Couche Business** — Moteur financier de la plateforme
> Statut : Référence | Priorité : Critique

---

## 1. Objectifs métier

Permettre à tout client de payer un business via Mobile Money ou carte bancaire, avec ou sans séquestre, et aux businesses de recevoir leurs fonds sur un wallet interne ou directement sur leur compte Mobile Money.

**Problème résolu :** En Afrique, moins de 5% des adultes ont une carte bancaire. Le Mobile Money (Wave, TMoney, Flooz, Moov Money, Orange Money, M-Pesa) est le moyen de paiement dominant.

**Valeur ajoutée :**
- Mobile Money natif (Wave, TMoney, Flooz, Moov Money, Orange Money)
- Paiement sécurisé via Escrow (séquestre jusqu'à confirmation)
- Dettes et échéanciers pour les clients de confiance
- Wallet interne pour regrouper les fonds
- Cartes bancaires via Stripe (marche secondaire)

---

## 2. Modèles de données

### Paiements

```
Payment {
  id                String          @id @default(uuid())
  userId            String
  businessId        String?
  escrowId          String?
  quoteId           String?
  invoiceId         String?
  orderId           String?
  bookingId         String?
  amount            Decimal         @db.Decimal(12, 2)
  currency          String          @default("FCFA")
  method            PaymentMethod   // WAVE, TMONEY, FLOOZ, MOOV, ORANGE_MONEY,
                                    // MPESA, STRIPE, CASH, WALLET
  status            PaymentStatus   // PENDING, SUCCESS, FAILED, REFUNDED
  reference         String?
  description       String?
  paidAt            DateTime?
  refundedAt        DateTime?
  isManual          Boolean         @default(false)
  verifiedBy        String?
  verifiedAt        DateTime?
  verificationNotes String?
  deletedAt         DateTime?
  user              User            @relation("UserPayments")
  business          Business?
  escrow            Escrow?
  quote             Quote?
  invoice           Invoice?
  order             Order?
  booking           Booking?
  proofs            PaymentProof[]
}

PaymentProof {
  id              String    @id @default(uuid())
  paymentId       String
  imageUrl        String    // Capture d'écran du paiement Mobile Money
  notes           String?
  verified        Boolean   @default(false)
  verifiedBy      String?
  verifiedAt      DateTime?
  rejectionReason String?
  payment         Payment
}
```

### Escrow

```
Escrow {
  id              String      @id @default(uuid())
  businessId      String
  orderId         String?     @unique
  invoiceId       String?     @unique
  quoteId         String?     @unique
  amount          Decimal     @db.Decimal(12, 2)
  currency        String      @default("FCFA")
  status          EscrowStatus // HELD, RELEASED, REFUNDED, DISPUTED
  fee             Decimal?    @db.Decimal(12, 2)
  feeRate         Float?      @default(0.02)
  netAmount       Decimal?    @db.Decimal(12, 2)
  releasedToWallet Boolean?   @default(false)
  releasedAt      DateTime?
  refundedAt      DateTime?
  disputedAt      DateTime?
  disputeReason   String?
  notes           String?
  deletedAt       DateTime?
  business        Business
  order           Order?
  invoice         Invoice?
  quote           Quote?
  payments        Payment[]
  savingsGroup    SavingsGroup?
  savingsCycle    SavingsCycle?
}
```

### Dettes

```
Debt {
  id              String        @id @default(uuid())
  businessId      String
  buyerId         String?
  orderId         String?       @unique
  invoiceId       String?       @unique
  quoteId         String?       @unique
  totalAmount     Decimal       @db.Decimal(12, 2)
  amountPaid      Decimal       @db.Decimal(12, 2) @default(0)
  remainingAmount Decimal       @db.Decimal(12, 2)
  currency        String        @default("FCFA")
  dueDate         DateTime?
  status          DebtStatus    // ACTIVE, PARTIALLY_PAID, OVERDUE, PAID, CANCELLED
  priority        DebtPriority  // LOW, MEDIUM, HIGH, CRITICAL
  sourceType      DebtSourceType // ORDER, INVOICE, QUOTE, MANUAL
  riskLevel       String?
  notes           String?
  deletedAt       DateTime?
  business        Business
  buyer           User?
  order           Order?
  invoice         Invoice?
  quote           Quote?
  reminders       DebtReminder[]
}

DebtReminder {
  id            String
  debtId        String
  type          DebtReminderType  // AUTO, MANUAL
  channel       DebtReminderChannel // WHATSAPP, EMAIL, SMS
  status        String
  content       String?
  sentAt        DateTime?
  errorMessage  String?
}
```

### Wallet

```
Wallet {
  id              String    @id @default(uuid())
  buyerId         String?
  businessId      String    @unique
  balance         Decimal   @db.Decimal(12, 2) @default(0)
  currency        String    @default("FCFA")
  locked          Boolean   @default(false)
  deletedAt       DateTime?
  buyer           User?
  business        Business
  transactions    WalletTransaction[]
}

WalletTransaction {
  id              String    @id @default(uuid())
  walletId        String
  type            String    // DEPOSIT, WITHDRAWAL, PAYMENT, REFUND, ESCROW_RELEASE, COMMISSION
  amount          Decimal   @db.Decimal(12, 2)
  balanceBefore   Decimal   @db.Decimal(12, 2)
  balanceAfter    Decimal   @db.Decimal(12, 2)
  currency        String    @default("FCFA")
  reference       String?
  description     String?
  metadata        Json?
  status          String    @default("COMPLETED")
  wallet          Wallet
}
```

---

## 3. Parcours utilisateur

### 3.1 Paiement Mobile Money

```
Client → Checkout → Mobile Money
  1. Sélectionne "Mobile Money"
  2. Choisit l'opérateur (Wave, TMoney, Flooz, Moov Money, Orange Money)
  3. Saisit son numéro de téléphone
  4. Redirection vers la page de paiement de l'opérateur (ou QR code)
  5. Client confirme le paiement sur son téléphone
  6. Webhook de l'opérateur → confirmation
  7. Statut de la commande mis à jour

Cas particulier : Paiement manuel
  → Le client envoie la capture d'écran du paiement
  → Le business vérifie l'image et confirme manuellement
  → PaymentProof stocké pour traçabilité
```

### 3.2 Paiement via Escrow

```
1. Client choisit "Paiement sécurisé Escrow"
2. Le montant est reçu par AfriBiz (séquestre)
3. Le business reçoit une notification "Paiement reçu, préparez la commande"
4. Le business prépare et expédie
5. Le client confirme la réception
6. Les fonds sont libérés vers le wallet du business
7. Commission AfriBiz prélevée (2%)
```

### 3.3 Dette / Paiement différé

```
1. Pour les clients de confiance (scoring > seuil)
2. Le business peut proposer un paiement différé (dette)
3. Montant dû, échéance, priorité
4. Rappels automatiques avant échéance
5. Possibilité de payer en plusieurs fois
6. Scoring client impacté par l'historique de paiement
```

### 3.4 Wallet business

```
1. Les fonds des ventes transitent par le wallet
2. Le business peut :
   - Consulter son solde
   - Voir l'historique des transactions
   - Demander un retrait vers son compte Mobile Money
   - Utiliser le solde pour acheter des services AfriBiz (pub, modules)
3. Le wallet est bloqué en cas de litige
```

---

## 4. Routes API

### Paiements

| Méthode | Route | Middleware |
|---------|-------|-----------|
| POST | `/api/payments/initiate` | auth | Initier paiement |
| POST | `/api/payments/confirm` | auth | Confirmer paiement manuel |
| GET | `/api/payments/:id` | auth | Détail paiement |
| GET | `/api/payments` | auth | Historique paiements |
| POST | `/api/payments/escrow/release` | auth, BUSINESS | Libérer escrow |
| POST | `/api/payments/escrow/dispute` | auth, BUSINESS | Ouvrir litige |
| POST | `/api/payments/escrow/refund` | auth, ADMIN | Rembourser escrow |

### Webhooks (pas de auth)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/payments/fedapay/webhook` | Webhook FedaPay (Mobile Money) |
| POST | `/api/payments/stripe/webhook` | Webhook Stripe |

### Dettes

| Méthode | Route | Middleware |
|---------|-------|-----------|
| GET | `/api/business/finance/debts` | auth, BUSINESS | Mes dettes actives |
| POST | `/api/business/finance/debts` | auth, BUSINESS | Créer dette |
| POST | `/api/business/finance/debts/:id/pay` | auth, CLIENT | Payer une dette |
| GET | `/api/business/finance/debts/reminders` | auth, BUSINESS | Rappels de dette |
| GET | `/api/business/finance/debts/risks` | auth, BUSINESS | Analyse des risques |

### Wallet

| Méthode | Route | Middleware |
|---------|-------|-----------|
| GET | `/api/wallet` | auth | Mon wallet |
| GET | `/api/wallet/transactions` | auth | Transactions |
| POST | `/api/wallet/withdraw` | auth, BUSINESS | Demander retrait |

---

## 5. Pages & Composants

| Page | Route |
|------|-------|
| Paiements (historique) | `/dashboard/payments` |
| Paiement (détail) | `/dashboard/payments/[id]` |
| Checkout | `/dashboard/payments/checkout` |
| Escrow | `/dashboard/payments/escrow` |
| Transactions | `/dashboard/payments/transactions` |
| Dettes | `/dashboard/debts-payments` |
| Wallet | `/dashboard/wallet` |
| Mes dettes (client) | `/dashboard/my-debts` |

### Composants

| Composant | Rôle |
|-----------|------|
| `payments/EscrowSteps` | Timeline visuelle du process escrow |
| `payments/HybridPaymentSection` | Sélecteur de mode de paiement |

---

## 6. Règles métier

- **RB-01** : Commission transaction = 1% du montant
- **RB-02** : Commission escrow = 2% du montant
- **RB-03** : L'escrow est obligatoire pour les transactions > 100 000 FCFA
- **RB-04** : Un litige escrow peut être ouvert par le client ou le business
- **RB-05** : Un litige non résolu après 7 jours → admin arbitre
- **RB-06** : Une dette avec dueDate dépassée → statut OVERDUE
- **RB-07** : Rappels dette : J-7, J-3, J-1, J+1, J+7, J+30
- **RB-08** : Le wallet ne peut pas être négatif
- **RB-09** : Un retrait wallet nécessite un compte Mobile Money vérifié

---

## 7. Permissions & Rôles

| Action | CLIENT | BUSINESS | ADMIN |
|--------|--------|----------|-------|
| Payer | ✓ | ✓ | — |
| Voir ses paiements | ✓ | ✓ | ✓ |
| Gérer escrow | — | ✓ | ✓ |
| Arbitrer litige | — | — | ✓ |
| CRUD dettes | — | ✓ | ✓ |
| Payer dette | ✓ | ✓ | — |
| Gérer wallet | — | ✓ | ✓ |
| Retrait wallet | — | ✓ | — |
| Voir tous wallets | — | — | ✓ |

---

## 8. Notifications

| Événement | Canal |
|-----------|-------|
| Paiement reçu (business) | In-app + WhatsApp |
| Paiement confirmé (client) | In-app + Email |
| Paiement échoué (client) | In-app |
| Paiement remboursé (client) | In-app + Email |
| Escrow libéré (business) | In-app + Email |
| Litige ouvert (admin) | In-app |
| Dette proche échéance (client) | WhatsApp + Email |
| Dette en retard (client + business) | WhatsApp + Email |
| Retrait wallet effectué (business) | In-app + Email |

---

## 9. Automatisations

| Règle | Déclencheur | Action |
|-------|------------|--------|
| Passage OVERDUE | dueDate dépassée et non payée | Statut → OVERDUE |
| Rappels dette | J-7, J-3, J-1, J+1, J+7, J+30 | Envoi notification |
| Libération escrow | Client confirme réception | Release vers wallet |
| Arbitrage auto | 7 jours sans résolution litige | Notification admin |
| Commission auto | Paiement confirmé | Prélèvement commission |

---

## 10. Critères d'acceptation

| AC | Critère |
|----|---------|
| AC-06-01 | Paiement Mobile Money → webhook → mise à jour statut |
| AC-06-02 | Paiement manuel avec preuve → vérification business → confirmation |
| AC-06-03 | Escrow → montant bloqué → confirmation client → libéré |
| AC-06-04 | Litige escrow → admin notifié, fonds bloqués |
| AC-06-05 | Arbitrage admin → fonds libérés ou remboursés |
| AC-06-06 | Dette créée → statut ACTIVE |
| AC-06-07 | Rappel dette envoyé à J-7 |
| AC-06-08 | Dette impayée → OVERDUE après dueDate |
| AC-06-09 | Wallet reçoit les fonds après commission |
| AC-06-10 | Retrait wallet → Mobile Money reçu |
| AC-06-11 | Commission correcte (1% transaction, 2% escrow) |