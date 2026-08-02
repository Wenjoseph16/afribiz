# TOME-16 — Devis, Factures & Comptabilité

> **Couche Client** — Gestion financière des transactions business-to-client
> Statut : Référence | Priorité : Haute

**Modèles :** Quote, QuoteItem, Invoice, InvoiceItem, FinancialLog, Expense

**Parcours Devis :**
1. Business crée un devis pour un client (items, quantités, prix)
2. Statuts : DRAFT → SENT → ACCEPTED → REFUSED → EXPIRED
3. Client reçoit le devis par WhatsApp/Email
4. Client accepte → le devis peut être converti en facture
5. Paiement Mobile Money intégré

**Parcours Facture :**
1. Création depuis un devis (accepté) ou directement
2. Statuts : DRAFT → SENT → PARTIALLY_PAID → PAID → OVERDUE → CANCELLED
3. Paiement partiel possible
4. Relances automatiques (J-7, J-3, J-1, J+1, J+7)

**Comptabilité :**
- FinancialLog : historique de toutes les actions financières
- Expense : dépenses du business (loyer, salaires, achats)
- Rapports mensuels (CA, dépenses, bénéfice)

**Règles métier :**
- RB-01 : Un devis expire après 30 jours (validUntil)
- RB-02 : Une facture en OVERDUE déclenche des relances automatiques
- RB-03 : Les dépenses sont catégorisables et déductibles
- RB-04 : Le numéro de devis/facture est auto-généré (FACT-YYYYMMDD-NNNNN)

**Routes API :** `/api/business/finance/invoices/*`, `/api/business/finance/quotes/*`, `/api/finance/*`

**Pages :** `dashboard/quotes/`, `dashboard/invoices/`, `dashboard/finance/`, `finance/transactions/`

**AC :** Création devis → envoi → acceptation → conversion facture → paiement → relance