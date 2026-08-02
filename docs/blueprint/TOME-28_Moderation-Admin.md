# TOME-28 — Modération & Admin

> **Couche Plateforme** — Administration et supervision de la plateforme
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Fournir aux administrateurs AfriBiz une console centralisée pour modérer, superviser, analyser, et gérer l'ensemble de la plateforme.

**Modèles :** (utilise Admin model existant, SecurityLog de TOME-01, Dispute de TOME-14, Review de TOME-18)

**Dashboard Admin (étendu) :**

### Supervision Générale
- KPIs plateforme : nb business actifs, nb clients, nb transactions, CA total
- Graphiques tendances (courbes, barres)
- Alertes systèmes (files d'attente, erreurs API)
- Carte des business actifs

### Gestion des Business
- Liste + recherche/filtres (statut vérification, module actif)
- Activation/désactivation d'un business
- Attribution privilèges Premium, crédits
- Vue complète d'un business (comme TOME-02)

### Modération Contenu
- Avis signalés (approuver/rejeter)
- Contenu inapproprié (stories, posts, produits)
- Litiges en attente d'arbitrage
- Blacklist de clients/business

### Gestion des Développeurs
- Validation des modules soumis
- Activation/désactivation des développeurs
- Commission sur ventes module
- Support développeur

### Configuration Plateforme
- Paramètres globaux (limites, seuils)
- Configuration Mobile Money (comptes, API keys)
- Templates de notifications
- Maintenance mode

### Finances & Commissions
- Revenus plateforme (abonnements, commissions pub, commissions modules)
- Payouts développeurs en attente
- Transactions suspectes
- Rapports financiers exportables

### Logs & Sécurité
- SecurityLog (échecs connexion, tentatives suspectes)
- Activité admin tracée
- Dernière connexion par admin
- Audit trail

**Pages :** `admin/`, `admin/businesses/`, `admin/users/`, `admin/reports/`, `admin/moderation/`, `admin/developers/`, `admin/finance/`, `admin/logs/`

**AC :** Console admin → supervision → modération → configuration → logs