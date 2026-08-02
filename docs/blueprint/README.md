# Blueprint AfriBiz — Cahier des Charges Exécutable

> **Document produit** — Équipe de conception AfriBiz
> Version 1.0 | Juillet 2026

---

## À propos de ce document

Ce blueprint est la **source de vérité unique** pour le développement de la plateforme AfriBiz. Chaque tome décrit un domaine fonctionnel avec un niveau de détail suffisant pour qu'un développeur (humain ou IA) puisse l'implémenter sans ambiguïté.

**Principe fondateur :** Ce document précède le code. Toute fonctionnalité développée doit être conforme au tome correspondant. Toute divergence est soit un bug, soit une évolution qui doit d'abord mettre à jour ce document.

---

## Structure des tomes

Chaque tome suit le format standardisé suivant :

| Section | Contenu |
|---------|---------|
| **1. Objectifs métier** | Pourquoi ce module existe, problème résolu, valeur ajoutée |
| **2. Modèles de données** | Tables Prisma, champs clés, relations, index |
| **3. Parcours utilisateur** | User journeys complets (happy path + edge cases) |
| **4. Routes API** | Endpoints backend, méthodes, middlewares, réponses |
| **5. Pages & Composants** | Pages frontend, composants, stores, hooks |
| **6. Règles métier** | Contraintes, validations, cas particuliers |
| **7. Permissions & Rôles** | Qui peut faire quoi, RBAC, ACL |
| **8. Notifications** | Déclencheurs, canaux, templates |
| **9. Automatisations** | Règles automatisées, campagnes, workflows |
| **10. Critères d'acceptation** | Conditions testables de validation |

---

## Table des matières

### Couche Fondation

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-00](TOME-00_Vision-Architecture-Stack.md) | Vision, Architecture & Stack Technique | Critique |
| [TOME-01](TOME-01_Auth-Securite-Onboarding.md) | Authentification, Sécurité & Onboarding | Critique |

### Couche Business

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-02](TOME-02_Profil-Business-Parametres.md) | Profil Business & Paramètres | Critique |
| [TOME-03](TOME-03_Produits-Services-Menu-Formations.md) | Produits, Services, Menu & Formations | Critique |
| [TOME-04](TOME-04_Commandes-Panier.md) | Commandes & Panier | Critique |
| [TOME-05](TOME-05_Reservations-Chambres-Locations-Evenements.md) | Réservations, Chambres, Locations & Événements | Haute |
| [TOME-06](TOME-06_Paiements-Escrow-Dettes-Wallet.md) | Paiements, Escrow, Dettes & Wallet | Critique |
| [TOME-07](TOME-07_Abonnements-Monetisation.md) | Abonnements & Monétisation | Haute |
| [TOME-08](TOME-08_Livraisons.md) | Livraisons | Haute |
| [TOME-09](TOME-09_Employes-RH.md) | Employés & RH | Moyenne |
| [TOME-10](TOME-10_Planning-Taches.md) | Planning & Tâches | Moyenne |
| [TOME-11](TOME-11_Partenaires.md) | Partenaires | Moyenne |
| [TOME-12](TOME-12_Documents-Signatures.md) | Documents & Signatures | Moyenne |
| [TOME-13](TOME-13_Tontines-Groupes-Epargne.md) | Tontines & Groupes d'Épargne | Moyenne |
| [TOME-14](TOME-14_Litiges-Support.md) | Litiges & Support | Moyenne |

### Couche Client

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-15](TOME-15_CRM-Clients.md) | CRM & Clients | Haute |
| [TOME-16](TOME-16_Devis-Factures-Comptabilite.md) | Devis, Factures & Comptabilité | Haute |
| [TOME-17](TOME-17_Messages-Chat.md) | Messages & Chat | Moyenne |
| [TOME-18](TOME-18_Avis-Evaluations.md) | Avis & Évaluations | Moyenne |

### Couche Marketing

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-19](TOME-19_Marketing-Promotions-Fidelite.md) | Marketing, Promotions & Fidélité | Haute |
| [TOME-20](TOME-20_Social-Stories-Shorts-Live-Feed.md) | Social — Stories, Shorts, Live & Feed | Moyenne |
| [TOME-21](TOME-21_Publicite-Ads.md) | Publicité (Ads) | Moyenne |
| [TOME-22](TOME-22_Portfolio-Temoignages.md) | Portfolio & Témoignages | Moyenne |

### Couche Écosystème

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-23](TOME-23_Marketplace-Developpeurs.md) | Marketplace Développeurs | Haute |

### Couche Intelligence

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-24](TOME-24_AfriScore-DataHub.md) | AfriScore & Data Hub | Moyenne |
| [TOME-25](TOME-25_Copilot-IA.md) | Copilot & IA | Moyenne |
| [TOME-26](TOME-26_Automatisations-Campagnes.md) | Automatisations & Campagnes | Haute |
| [TOME-27](TOME-27_Croissance-Opportunites.md) | Croissance & Opportunités | Basse |

### Couche Plateforme

| Tome | Domaine | Priorité |
|------|---------|----------|
| [TOME-28](TOME-28_CMS-Site-Public.md) | CMS & Site Public | Critique |
| [TOME-29](TOME-29_Administration-Plateforme.md) | Administration Plateforme | Haute |
| [TOME-30](TOME-30_Notifications-Alertes.md) | Notifications & Alertes | Haute |
| [TOME-31](TOME-31_Infrastructure-DevOps.md) | Infrastructure & DevOps | Haute |

---

## Conventions d'écriture

- **Termes techniques** : en anglais dans le code, en français dans le blueprint
- **Modèles Prisma** : référencés avec `ModelName`
- **Routes API** : écrites comme `GET /api/resource`
- **Pages frontend** : référencées par leur chemin dans `app/`
- **Composants** : référencés par `ComponentName`
- **Notifications** : format `[TYPE] — canal — déclencheur`
- **Critères d'acceptation** : préfixés par `AC-` (ex: `AC-01`)

---

## Glossaire du domaine

| Terme | Définition |
|-------|-----------|
| **AfriBiz** | Plateforme SaaS de digitalisation des PME africaines |
| **Business** | Commerçant, artisan ou prestataire utilisant la plateforme |
| **Client** | Acheteur ou consommateur final |
| **Développeur** | Créateur de modules complémentaires pour le marketplace |
| **Admin** | Administrateur de la plateforme |
| **Mobile Money** | Paiement mobile (Wave, TMoney, Flooz, Moov Money) |
| **Escrow** | Paiement séquestré jusqu'à confirmation de livraison |
| **Tontine** | Groupe d'épargne rotative (ROSCA) |
| **AfriScore** | Système de notation des businesses sur la plateforme |
| **Copilot** | Assistant IA pour la gestion quotidienne |
| **Module** | Extension fonctionnelle activable sur un profil business |
| **Offre Flash** | Promotion géolocalisée à durée limitée |