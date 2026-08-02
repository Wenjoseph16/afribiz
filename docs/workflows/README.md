# 📁 DOCS / WORKFLOWS

Chaque workflow d'AfriBiz est documenté dans ce dossier sous la forme d'un **organigramme**.
Le but : savoir exactement **où va chaque donnée** quand un utilisateur fait une action.

## Format obligatoire (à respecter pour chaque workflow)

Chaque rapport contient **4 sections** :

### 1. Flux actuel (avant correction)
```
Client
  ↓
Action  (ex : Connexion)
  ↓
API  (ex : POST /auth/login)
  ↓
Service → DB
```
Ce qui se passe réellement aujourd'hui — on voit les maillons manquants.

### 2. Flux corrigé (après correction)
```
Client
  ↓
Action
  ↓
API
  ↓
Publisher (événement)
  ↓
Notifications
  ↓
Historique / Logs
  ↓
Stats / Analytics
  ↓
Dashboards
  ↓
Data Hub
  ↓
Growth Engine
```
Chaque étape indique **ce qui change** (donnée, table, écran, socket).

### 3. Relations créées
Tableau `Source → Cible` avec ✅ : toutes les connexions vérifiées dans le code.

### 4. Relations encore absentes
Tableau `Source → Cible` avec ❌ : connexions qui manquent encore (à traiter plus tard).

## Règles
1. **Aucun nom de fonction** dans le flux — uniquement des **parcours de données**.
2. Toujours un exemple complet (une action type avec toutes ses conséquences).
3. Vérifier chaque affirmation dans le code avant de l'écrire (✅ = vérifié, ❌ = absent vérifié).
4. Numéroter les fichiers : `01-auth.md`, `02-produits.md`, `03-commandes.md`…

## Liste des workflows
| # | Fichier | État |
|---|---|---|
| 01 | Auth | ✅ corrigé + documenté |
| 02 | Profil Client | ⏳ |
| 03 | Profil Business | ⏳ |
| 04 | Profil Développeur | ⏳ |
| 05 | Dashboard Admin | ⏳ |
| 06 | Produits | ⏳ |
| 07 | Services | ⏳ |
| 08 | Réservations | ⏳ |
| 09 | Commandes | ⏳ |
| 10 | Paiements | ⏳ |
| 11 | Devis | ⏳ |
| 12 | Factures | ⏳ |
| 13 | Employés | ⏳ |
| 14 | Promotions | ⏳ |
| 15 | Publicités | ⏳ |
| 16 | Livraisons | ⏳ |
| 17 | Documents | ⏳ |
| 18 | Partenaires | ⏳ |
| 19 | Événements | ⏳ |
| 20 | Portfolio | ⏳ |
| 21 | Avis | ⏳ |
| 22 | Notifications | ⏳ |
| 23 | Marketplace | ⏳ |
| 24 | Modules | ⏳ |
| 25 | Messages | ⏳ |
| 26 | Statistiques | ⏳ |
| 27 | Rapports | ⏳ |
| 28 | Data Hub | ⏳ |
| 29 | Paramètres | ⏳ |
| 30 | Interactions entre rôles | ⏳ |
