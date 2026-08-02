# TOME-19 — Marketing, Promotions & Fidélité

> **Couche Marketing** — Acquisition, rétention et croissance
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Permettre aux businesses de créer des promotions, gérer des programmes de fidélité, lancer des campagnes marketing, et suivre leur efficacité.

**Modèles :** Promotion, Coupon, Bundle, BundleItem, MarketingCampaign, PromotionLog, LoyaltyProgram, LoyaltyPoints, LoyaltyTransaction

**Parcours :**

### Promotions & Coupons
1. Business crée une promotion (réduction %, montant fixe, ou code promo)
2. Cible : tous les clients, nouveaux clients, clients VIP, ou segments spécifiques
3. Conditions : montant minimum, validité, usage max
4. Le client applique le code au checkout
5. Business suit les performances (usage, CA généré)

### Bundles
1. Business crée un pack (ex: "Menu enfant" = plat + dessert + boisson)
2. Prix du bundle < somme des prix individuels
3. Le client voit l'économie réalisée

### Programme de Fidélité
1. Business configure : points par montant dépensé, paliers
2. Client accumule des points à chaque achat
3. Les points peuvent être échangés contre des réductions ou produits
4. Bonus : anniversaire, filleul

### Campagnes Marketing
1. Business crée une campagne (objectif, canal, message)
2. Ciblage : clients, segments, ou prospects
3. Envoi par WhatsApp, Email, In-app
4. Suivi : envoyés, ouverts, cliqués

**Règles métier :**
- RB-01 : Un code promo est unique (généré aléatoirement ou personnalisé)
- RB-02 : Une promotion ne peut pas cumuler plusieurs codes
- RB-03 : Le programme fidélité est activable par module
- RB-04 : Les points fidélité expirent après 6 mois d'inactivité
- RB-05 : Le birthday bonus est envoyé automatiquement le jour J

**Pages :** `dashboard/promotions/`, `promotions/bundles/`, `promotions/campaigns/`, `promotions/coupons/`, `promotions/loyalty/`, `promotions/stats/`

**AC :** Création promotion → application checkout → tracking usage → campagne → fidélité