# TOME-15 — CRM & Clients

> **Couche Client** — Gestion de la relation client 360°
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Offrir aux businesses une vue complète de leurs clients : historique d'achats, réservations, comportement, scoring risque, segmentation.

**Modèles :** BusinessClient, ClientRisk, ClientSegment, SegmentClient, ClientNote, BusinessClientTag, ClientActivityLog, BusinessPageView, ProductView, ProductClick

**Parcours :**
1. **Vue 360°** : Le business voit chaque client avec son historique complet (commandes, réservations, dépenses, dernières visites)
2. **Segmentation** : Créer des segments (ex: "Fidèles", "Inactifs 30 jours", "Gros dépensiers")
3. **Tags** : Étiqueter les clients (ex: "VIP", "En retard de paiement")
4. **Notes** : Ajouter des notes internes sur un client
5. **Scoring risque** : Calcul automatique du risque client (retards, litiges)
6. **Pipeline CRM** : Suivi des prospects et clients actifs

**Règles métier :**
- RB-01 : Le scoring risque est calculé sur : retards de paiement, nombre de litiges, ancienneté
- RB-02 : Un client blacklisté ne peut plus commander chez ce business
- RB-03 : Les segments dynamiques se mettent à jour automatiquement (conditions re-évaluées)
- RB-04 : Les pages vues et produits consultés sont trackés pour l'analytics

**Pages :** `dashboard/clients/`, `clients/[id]`, `clients/analytics/`, `clients/segments/`, `dashboard/crm/`, `crm/pipeline/`, `crm/automation/`

**Composants :** `customer360/PageViewTracker`, `customer360/ProductTracker`

**AC :** Vue 360° client → segmentation → scoring risque → pipeline CRM → automatisation