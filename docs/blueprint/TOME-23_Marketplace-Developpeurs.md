# TOME-23 — Marketplace Développeurs

> **Couche Écosystème** — Plateforme d'extension et marketplace de modules
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Permettre à des développeurs tiers de créer et vendre des modules complémentaires sur la plateforme AfriBiz, et aux businesses de les installer pour étendre leurs fonctionnalités.

**Modèles :** DeveloperProfile, DeveloperModule, DeveloperModuleVersion, DeveloperModuleInstallation, DeveloperModuleReview, DeveloperSupportTicket, DeveloperSupportMessage, DeveloperRevenue, DeveloperPayout, DeveloperApiKey, ModuleWebhook, WebhookDelivery, DeveloperBadge, ModulePermission, ModuleConfiguration, ModuleActivityLog, ModuleManifest, ModuleCommission, ModuleAnalytics, ModuleErrorLog, ModuleValidation, ValidationCheck, DeveloperModuleSubscription, ModuleLicense

**Parcours Développeur :**

### Inscription & Vérification
1. S'inscrit comme développeur (rôle DEVELOPER)
2. Complète son profil (compétences, technologies, portfolio)
3. Vérification d'identité (documents)
4. Accès au dashboard développeur

### Création d'un module
1. Crée un module (nom, slug unique, description, logo, images)
2. Définit les versions (fichier, changelog, release notes)
3. Configure les permissions requises (lecture clients, écriture commandes…)
4. Définit le pricing (gratuit, payant, abonnement)
5. Soumet à validation
6. Admin valide → module publié sur le marketplace

### Installation par un business
1. Business navigue dans le marketplace développeur
2. Découvre des modules (catégories, recherche, tendances)
3. Consulte la fiche (description, avis, captures)
4. Installe le module (gratuit) ou souscrit (payant)
5. Le module est activé sur le profil business
6. Configuration des paramètres du module

### Monétisation
- **Vente directe** : prix unique pour le module
- **Abonnement** : mensuel ou annuel
- **Commission AfriBiz** : 15-20% sur chaque vente
- **Revenus** : suivi dans le dashboard développeur
- **Payout** : demande de retrait vers Mobile Money

**Règles métier :**
- RB-01 : Un développeur doit être vérifié pour publier un module
- RB-02 : Chaque version de module est soumise à validation
- RB-03 : Les permissions requises par le module sont affichées avant installation
- RB-04 : Commission prélevée automatiquement sur chaque vente
- RB-05 : Payout minimum : 10 000 FCFA
- RB-06 : Un module peut être désactivé par l'admin (TOS violation)
- RB-07 : API keys développeur avec scopes limités
- RB-08 : Webhooks pour notifications d'événements

**Pages dashboard développeur :**
`dashboard/developer/` — overview, modules, versions, installations, licenses, analytics, revenue, payouts, support, api, webhooks, settings, validation

**AC :** Création module → validation → publication marketplace → installation business → commission → payout