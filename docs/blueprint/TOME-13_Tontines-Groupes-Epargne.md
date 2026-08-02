# TOME-13 — Tontines & Groupes d'Épargne

> **Couche Business** — Gestion des groupes d'épargne rotative (ROSCA)
> Statut : Référence | Priorité : Moyenne

---

## 1. Objectifs métier

Permettre aux businesses de créer et gérer des groupes d'épargne (tontines) — un système d'épargne collective où les membres cotisent à tour de rôle et reçoivent la cagnotte.

**Valeur ajoutée :** La tontine est une institution sociale ancrée en Afrique. En la digitalisant sur AfriBiz, on apporte transparence, traçabilité et sécurité aux cotisations.

---

## 2. Modèles de données

```
SavingsGroup {
  id                  String              @id @default(uuid())
  businessId          String
  name                String
  description         String?
  type                SavingsGroupType    @default(ROTATING)
  currency            String              @default("FCFA")
  contributionAmount  Decimal?            @db.Decimal(12, 2)
  frequency           String              @default("weekly")
  maxMembers          Int                 @default(10)
  startDate           DateTime?
  endDate             DateTime?
  status              SavingsGroupStatus  @default(ACTIVE)
  rules               Json?               // Règles personnalisées
  members             SavingsMember[]
  cycles              SavingsCycle[]
  escrow              Escrow?             // Fonds séquestrés
}

SavingsMember {
  id                  String    @id @default(uuid())
  groupId             String
  userId              String?
  name                String
  phone               String
  email               String?
  role                MemberRole @default(MEMBER) // ADMIN, MEMBER
  joinedAt            DateTime   @default(now())
  isActive            Boolean    @default(true)
  contributions       SavingsContribution[]
  group               SavingsGroup
}

SavingsCycle {
  id                  String    @id @default(uuid())
  groupId             String
  cycleNumber         Int
  startDate           DateTime
  endDate             DateTime?
  totalAmount         Decimal?  @db.Decimal(12, 2)
  status              String    @default("ACTIVE")
  payoutDate          DateTime?
  completedAt         DateTime?
  totalCollected      Decimal?  @default(0) @db.Decimal(12, 2)
  totalDistributed    Decimal?  @default(0) @db.Decimal(12, 2)
  contributions       SavingsContribution[]
  group               SavingsGroup
}

SavingsContribution {
  id          String    @id @default(uuid())
  cycleId     String
  memberId    String
  amount      Decimal   @db.Decimal(12, 2)
  currency    String    @default("FCFA")
  status      SavingsContributionStatus @default(PENDING)
  paidAt      DateTime?
  method      String?   // WAVE, TMONEY, CASH
  reference   String?
  notes       String?
  cycle       SavingsCycle
  member      SavingsMember
}
```

---

## 3. Parcours utilisateur

```
1. Business crée un groupe d'épargne (nom, montant, fréquence, max membres)
2. Invitation des membres (téléphone, WhatsApp)
3. Les membres reçoivent une invitation et confirment
4. Chaque cycle : les membres cotisent au montant défini
5. À la fin du cycle, la cagnotte est versée au bénéficiaire du tour
6. Un nouveau cycle commence automatiquement
7. Historique visible par tous les membres
```

---

## 4. Règles métier

- **RB-01** : Type ROTATING = chaque membre reçoit la cagnotte à tour de rôle
- **RB-02** : Une cotisation peut être en cash (déclarée manuellement) ou via Mobile Money
- **RB-03** : Les fonds sont séquestrés dans un escrow dédié
- **RB-04** : Un membre peut être exclu par le créateur du groupe
- **RB-05** : Un cycle est automatiquement créé à la fin du précédent

**Pages :** `dashboard/savings/`, `savings/[id]`, `savings/new`

**AC :** Création groupe → invitation membres → cotisations → cycle complété → payout