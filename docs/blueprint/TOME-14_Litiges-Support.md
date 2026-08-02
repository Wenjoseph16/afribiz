# TOME-14 — Litiges & Support

> **Couche Business** — Gestion des conflits et demandes d'aide
> Statut : Référence | Priorité : Moyenne

**Modèles :** Dispute (litiges), ContentReport (signalements)

**Types de litiges :**
- Litige commande (produit non conforme, non livré)
- Litige réservation (client non présent, annulation tardive)
- Litige escrow (désaccord sur libération des fonds)
- Litige partenaire

**Parcours :**
1. Client ou business ouvre un litige (titre, description, pièces jointes)
2. Le litige est assigné (priorité : LOW → MEDIUM → HIGH → CRITICAL)
3. Résolution à l'amiable (business + client dialoguent)
4. Si pas de résolution → escalation admin
5. Décision admin → remboursement ou libération des fonds
6. Log de sécurité créé pour traçabilité

**Pages :** `dashboard/disputes/`, `support/`

**AC :** Création litige → escalation → admin arbitre → résolution