# TOME-11 — Partenaires

> **Couche Business** — Écosystème de collaboration
> Statut : Référence | Priorité : Moyenne

**Modèles :** Partner, PartnerContract, PartnerTransaction, PartnerAssignment, PartnerReview, PartnerDocument, PartnerPermission

**Parcours utilisateur :**
1. Un business invite un partenaire (freelance, fournisseur, collaborateur)
2. Signature d'un contrat (durée, montant, conditions)
3. Assignation de tâches au partenaire
4. Suivi des transactions et paiements
5. Évaluation du partenaire
6. Permissions granulaires par module

**Types de partenaires :**
- **Collaborateur** : accès limité à certaines fonctionnalités
- **Fournisseur** : approvisionnement en produits/ingrédients
- **Prestataire** : services externalisés (livraison, nettoyage)
- **Affilié** : commission sur ventes référées

**Permissions partenaires :**
Chaque partenaire a des permissions spécifiques par module :
- `COMMANDES` : lecture seule ou gestion
- `PRODUITS` : mise à jour des stocks
- `LIVRAISON` : gestion des tournées
- `PLANNING` : voir ses tâches assignées

**Pages :** `dashboard/partners/`, `partners/contracts/`, `partners/transactions/`

**AC :** Invitation partenaire → contrat signé → permissions appliquées → tâches assignées