# TOME-24 — Analytics & Dashboard

> **Couche Intelligence** — Tableaux de bord et métriques
> Statut : Référence | Priorité : Haute

**Modèles :** AnalyticsEvent, PeriodAggregation, DashboardWidget, DashboardLayout, MetricSnapshot, ScheduledReport, ReportDeliveryLog

**Types de métriques :**

### Commerciales
- Chiffre d'affaires (jour, semaine, mois, année)
- Nombre de commandes/réservations
- Panier moyen
- Produits les plus vendus
- Taux de conversion (visite → achat)
- Tendance croissance (MoM, YoY)

### Clients
- Nombre total de clients
- Nouveaux vs récurrents
- Taux de rétention
- Valeur vie client (LTV)
- Clients inactifs

### Marketing
- Performance des promotions
- Taux d'utilisation des coupons
- Retour sur investissement campagne
- Segmentation engagement

### Opérationnelles
- Temps moyen de préparation
- Taux de livraison à l'heure
- Taux d'annulation
- Satisfaction client (NPS)

**Dashboards :**
- **Accueil** : KPIs principaux, tendances, alertes
- **Ventes** : CA, commandes, évolution
- **Clients** : acquisition, rétention, segments
- **Marketing** : campagnes, promotions, ROI
- **Opérations** : performances, stocks
- **Finances** : revenus, dépenses, bénéfices

**Pages :** `dashboard/`, `dashboard/analytics/`, `dashboard/analytics/reports/`, `dashboard/analytics/realtime/`, `dashboard/analytics/custom/`

**AC :** Métriques temps réel → rapports périodiques → widgets personnalisables → export