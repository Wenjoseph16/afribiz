# TOME-25 — Rapports & Export

> **Couche Intelligence** — Génération de rapports
> Statut : Référence | Priorité : Moyenne

**Modèles :** (utilise métriques de TOME-24)

**Types de rapports :**
- **Rapport journalier** : CA, nb commandes, nb réservations
- **Rapport hebdomadaire** : tendances, produits, clients
- **Rapport mensuel** : récapitulatif complet avec graphiques
- **Rapport financier** : factures, dépenses, bénéfices
- **Rapport clients** : acquisition, rétention, top clients
- **Rapport employés** : performances, heures, commissions
- **Rapport livraisons** : zones, chauffeurs, délais
- **Rapport inventaire** : variations stock, ruptures

**Formats d'export :**
- PDF (avec logo, graphiques)
- Excel/CSV (données brutes)
- JSON (pour API)

**Règles métier :**
- RB-01 : Rapport généré en tâche de fond (bull queue)
- RB-02 : Export limité à 12 mois glissants
- RB-03 : Les rapports sont envoyés par email/WhatsApp
- RB-04 : Planification possible (quotidien, hebdo, mensuel)

**Pages :** `dashboard/reports/`, `dashboard/reports/scheduled/`

**AC :** Génération rapport → prévisualisation → export PDF/Excel → planification