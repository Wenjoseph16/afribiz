# Workflow #3 — Profil Business : Blueprint V2 (vision complète)

> **Décisions validées** : Redesign workspace complet · Blueprint global puis exécution pôle par pôle.
> Méthode : vision complète sur papier avant le code (comme pour l'admin).
> Sources : audit réel du code (backend/src, frontend/src, prisma) — 4 espaces, 330+ pages.

---

## 🎯 1. La mentalité

Un utilisateur AfriBiz peut être **Client + Business + Développeur + Admin** en même temps.
Comme les géants (Notion, Shopify, Upwork, Fiverr) : **une identité, plusieurs espaces, chacun
avec son cockpit dédié** et un sélecteur d'espace **explicite, mémorisé, jamais magique**.

Les 3 principes (mêmes que l'admin) :
1. **Proactif** — le système apporte les événements (nouvelle commande, stock faible, tontine à clôturer, avis négatif).
2. **Actionnable** — chaque alerte = action en 1 clic.
3. **Traçable** — client 360, cycle de vie de chaque commande/contrat/cycle.

---

## 🗺️ 2. La carte des 4 espaces (inventaire complet du code)

### 🟢 Espace Client (8 groupes)
Général · Activités (panier, commandes, réservations, locations, événements, formations) ·
Finances (wallet, paiements, factures, escrow) · Découverte (explore, smart-search, matching,
favoris, avis, stories, shorts, lives) · Fidélité (points, parrainage) ·
Communication (messages, notifications) · Compte · Évoluer (devenir business/dev)

### 🟠 Espace Business (7 groupes actuels → 10 pôles, voir §4)
Général · Social Commerce · CRM & Relation Client · Marketing & Croissance (19 items) ·
Wallet Business (dont Tontine & Épargne, Réseau Agents) · Configuration (fourre-tout) · Data Hub
+ **21 modules métier dynamiques** : Produits, Services, Menu/QR, Chambres, Réservations,
Commandes, Événements, Locations, Portfolio, Devis & Factures, Créances, Abonnements,
Livraisons, Employés/RH/Paie, Planning, Formations, Documents/Signatures, Partenaires,
Litiges, Tâches avancées, Marketplace développeurs — chacun avec ses sous-pages.

### 🔵 Espace Développeur (12 groupes)
Général · Media (hub, stories, shorts, lives) · Modules (créer, versions) · Marketplace
(validation) · Revenus (ventes, abonnements, retraits, factures) · Clients (installations) ·
Communication (messages, support, avis) · Analyse (analytics, performance) · Marketing ·
Documentation (docs, communauté) · Profil (abonnement, API, sécurité, paramètres) · Sandbox/simulation

### 🔴 Espace Admin (9 pôles — déjà validés et livrés)
Command center, identités, économie, marketplace, confiance, support, contenu, observabilité, gouvernance.

---

## 🏛️ 3. Le redesign workspace (la fondation UX)

### Problème actuel (confirmé dans le code)
1. **Chemins partagés ambigus** : `/dashboard/products`, `/dashboard/wallet`, `/dashboard/escrow`…
   utilisés par client ET business → décision fragile par `onSharedBusinessPath && activeSpace`.
2. **Groupes mal structurés** : « Configuration » = fourre-tout, « Marketing & Croissance » = 19 items.

### Modèle cible
```
┌──────────────────────────────────────────────────────────────┐
│ [👤 Espace Client ▾] [🏪 Business] [💻 Développeur] [🛡️ Admin]  ← sélecteur persistant (choix mémorisé)
├──────────────────────────────────────────────────────────────┤
│ Sidebar 100% dédiée à l'espace choisi, groupes réorganisés   │
└──────────────────────────────────────────────────────────────┘
```
- Sélecteur d'espace explicite, mémorisé (persistance), synchro par rôle accessible.
- **Chaque page appartient à un seul espace** (plus d'ambiguïté de chemin).
- Chemin d'URL par espace : `/dashboard/business/*` explicite ; les pages partagées résolues par l'espace choisi (déterminisme, pas d'inférence).
- Sidebar par espace = groupes curatés (client 8 groupes restructurés · business 10 pôles · dev 12 · admin 9).

---

## 🏛️ 4. Les 10 pôles business (restructuration de la sidebar)

| Pôle | Contenu | Valeur clé |
|---|---|---|
| **1. Pilotage** | Tableau de bord (cockpit), Page publique, Alertes, Brief du matin, Progression de lancement | Le Mission Control |
| **2. Catalogue** | Produits, Services, Menu/QR, Chambres, Locations, Formations, Portfolio + sous-pages (stock, catégories, import, ingrédients, tables) | Vendre |
| **3. Ventes** | Commandes, Réservations, Devis & Factures, Créances, Abonnements, Livraisons | Encaisser |
| **4. Clients & CRM** | Clients, Segments, Pipeline, Automation, Intelligence client, Avis, Messagerie, Commentaires | Fidéliser |
| **5. Marketing** | Promotions, Coupons, Offres flash, Bundles, Campagnes, Fidélité, Publicités, **Achat Groupé**, Réseaux sociaux, Gamification (badges/défis) | Croître |
| **6. Finance** | Wallet, Transactions, Paiements, Escrow, Comptabilité, **Tontine & Épargne**, **Réseau Agents**, Taxes ZLECAF, Paiements hybrides | Gérer l'argent |
| **7. Équipe** | Employés, Rôles, Pointage, Congés, Paie, Performance, Planning, Tâches avancées, Documents, Signatures | Organiser |
| **8. Social Commerce** | Stories, Shorts, Lives, Media Commerce, Explorer, Flux | Visibilité & ventes sociales |
| **9. Croissance** | Analytics, Flux temps réel, Data Hub, AfriScore (+ défis), Growth Engine, Coaching, Attention, Opportunités, Intelligence | Décider |
| **10. Config & Intégrations** | Paramètres, Mes modules, Notifications, Automatisations, Catalogue Vocal, Mode Hors-ligne, Unités, Consentements, Support | Maîtriser |

---

## 💎 5. Les super-pouvoirs AfriBiz (différenciateurs qui battent les géants)

1. **Tontine & Épargne groupe** — la finance sociale africaine, intégrée au business (cycles, cotisations, paiements).
2. **Achat Groupé** — commandes groupées, négociation collective.
3. **Social Commerce** — vendre via stories/shorts/lives (media-commerce).
4. **Marketplace développeurs** — le business installe des modules construits par des devs tiers (revenus partagés).
5. **Client 360** — toute l'histoire du client sur un écran.
6. **AfriScore actionnable** — score + « comment l'améliorer » + défis/gamification.
7. **Copilot IA + Growth Engine** — briefs matinaux, opportunités, coaching.
8. **Catalogue Vocal** — commande par la voix (vocalSttService).
9. **QR Menu** — le restaurant sans app, scan → commande.
10. **Mode Hors-ligne** — le commerce continue sans connexion.
11. **Réseau Agents** — agents de paiement terrain.
12. **« Voir ma page comme un client »** + escrow + mobile money (la confiance).

---

## 🔗 6. Le catalogue des relations (les chaînes qui font la magie)

Chaque chaîne = 1 action déclencheur → mise à jour automatique de tous les maillons.

| # | Chaîne | Maillons |
|---|---|---|
| 1 | **Commande validée** ⭐ | Commande → **Facture auto-créée** → Comptabilité → Wallet (CA) → Stock décrémenté → Notif client + business → AfriScore → Analytics |
| 2 | **Réservation confirmée** | Réservation → Paiement/escrow → Calendrier occupé → Rappel auto (cron) → Notif → Stats |
| 3 | **Avis posté** | Avis → Recalcul note → AfriScore → Badge → Page publique → Notif business |
| 4 | **Stock faible** | Stock ≤ seuil → Alerte → Réassort → Historique |
| 5 | **Client fidèle** | Commande → Points fidélité → Récompense → Campagne ciblée → CRM |
| 6 | **Commande livrée** | Livraison → Livreur → Suivi temps réel → Enquête satisfaction → CRM |
| 7 | **Devis accepté** | Devis → Facture → Paiement → Comptabilité → Wallet |
| 8 | **Tontine/Épargne** | Cycle → Paiements membres → Wallet → Notifs → Historique |
| 9 | **Billet événement** | Ticket vendu → Participant → Wallet → Stats événement |
| 10 | **Partenaire** | Contrat → Commission → Transactions → Wallet |
| 11 | **Employé congé** | Congé → Planning → Remplacement → Notif équipe |
| 12 | **Module dev installé** | Installation → Activation module → Permission → Facturation → Revenue dev |

---

## 📊 7. État réel (muscles ✅ vs cerveau ❌)

**Backend bien équipé** : createBusiness + événements, page publique, KYC, plans & limites,
wallet/escrow, tontines (savingsGroupService), achat groupé, social commerce, marketplace dev,
RH, CRM/360, analytics, data hub, copilot, growth engine, 8+ crons, socket business:event,
customer360, vocal, hors-ligne.

**Couche d'expérience à construire** :
- **F1** — Redesign workspace (sélecteur + sidebars dédiées + 10 pôles) — la fondation
- **F2** — Plan auto-assigné à la création (planId + BusinessSubscription) + guard UX onboarding
- **F3** — Cockpit : file d'alertes business, brief du matin, progression de lancement, widget KYC, plan/quotas
- **F4** — Chaînes de relations : commande→facture→compta (la priorité métier), puis les autres
- **F5** — Recherche globale + actions 1-clic + page abonnement clarifiée

---

## 🛠️ 8. Plan d'exécution (pôle par pôle, validation après chaque phase)

| Phase | Périmètre | Livrable mesurable |
|---|---|---|
| **P0 — Fondation workspace** | Sélecteur d'espace persistant + sidebars dédiées + business restructuré en 10 pôles | Navigation pro, zéro rebond client/business |
| **P1 — Socle plan & parcours** | Plan auto-assigné + guard UX + onboarding guidé (post-création) | Nouveau business : plan défini, zéro erreur |
| **P2 — Pilotage (pôle 1)** | Cockpit : alertes business, brief du matin, progression, KYC, plan/quotas | Dashboard = centre de commande |
| **P3 — Ventes (pôle 3)** | Chaîne commande→facture→compta→wallet→AfriScore câblée + pipeline | La chaîne valeur n°1 fonctionne de bout en bout |
| **P4 — Finance (pôle 6)** | Tontine/épargne, agents, taxes reliées au wallet + notifications | La finance sociale tourne |
| **P5 — Clients & CRM (pôle 4)** | Client 360, fidélité→campagne, avis→AfriScore | Fidélisation automatisée |
| **P6 — Catalogue/Marketing/Social/Équipe/Croissance** | Les pôles restants, câblage des chaînes 2→12 | Tout est connecté |
| **P7 — Recherche & actions 1-clic** | Recherche globale, actions rapides, page abonnement claire | Fluidité totale |

**Règle d'or** : chaque action déclenche la chaîne complète (notif + socket + compteur + historique + AfriScore + Data Hub).
Validation après chaque phase : tests ciblés + TSC + test browser réel.
