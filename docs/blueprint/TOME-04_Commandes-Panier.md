# TOME-04 — Commandes & Panier

> **Couche Business** — Moteur de transactions commerciales
> Statut : Référence | Priorité : Critique

---

## 1. Objectifs métier

Permettre aux clients de passer des commandes (produits, services, menu) et aux businesses de les gérer de la réception à la livraison/remise.

**Problème résolu :** Un client veut acheter un produit, réserver un service ou commander un repas. Le business doit recevoir, confirmer, préparer et livrer la commande.

**Valeur ajoutée :**
- Parcours complet : panier → checkout → confirmation → suivi
- Types : produits physiques, services, menu, personnalisé
- Sources : site web, WhatsApp, QR table, walk-in
- Statuts avec timeline visuelle

---

## 2. Modèles de données

```
Cart {
  id          String    @id @default(uuid())
  userId      String    @unique
  couponId    String?
  notes       String?
  user        User
  coupon      Coupon?
  items       CartItem[]
}

CartItem {
  id          String    @id @default(uuid())
  cartId      String
  productId   String?
  variantId   String?
  serviceId   String?
  name        String
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(12, 2)
  total       Decimal   @db.Decimal(12, 2)
  image       String?
  notes       String?
  cart        Cart
  product     Product?
  variant     ProductVariant?
  service     Service?
}

Order {
  id              String      @id @default(uuid())
  businessId      String?
  buyerId         String?
  orderNumber     String      @unique
  type            OrderType   // PRODUIT, SERVICE, MENU, PERSONNALISE
  source          OrderSource // AFRIBIZ_SITE, WHATSAPP, QR_TABLE, WALK_IN, API
  status          OrderStatus // PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED, REFUNDED
  totalAmount     Decimal     @db.Decimal(12, 2)
  subtotal        Decimal     @db.Decimal(12, 2)
  taxAmount       Decimal?    @db.Decimal(12, 2)
  deliveryFee     Decimal?    @db.Decimal(12, 2)
  discountAmount  Decimal?    @db.Decimal(12, 2)
  currency        String      @default("FCFA")
  notes           String?
  internalNotes   String?
  deliveryZoneId  String?
  deliveryStatus  String?
  deliveryAddress String?
  deliveryLat     Float?
  deliveryLng     Float?
  contactPhone    String?
  contactName     String?
  scheduledAt     DateTime?
  paidAt          DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  paymentMethod   String?
  paymentStatus   String?
  acceptedAt      DateTime?
  preparingAt     DateTime?
  readyAt         DateTime?
  completedAt     DateTime?
  refusedAt       DateTime?
  refuseReason    String?
  guestEmail      String?
  deletedAt       DateTime?
  business        Business?
  buyer           User?     @relation("BuyerOrders")
  deliveryZone    DeliveryZone?
  items           OrderItem[]
  payments        Payment[]
  escrow          Escrow?
  debt            Debt?
  delivery        Delivery?
  planningTasks   PlanningTask[]
}

OrderItem {
  id            String    @id @default(uuid())
  orderId       String
  productId     String?
  variantId     String?
  menuItemId    String?
  serviceId     String?
  name          String
  quantity      Int       @default(1)
  unitPrice     Decimal   @db.Decimal(12, 2)
  total         Decimal   @db.Decimal(12, 2)
  notes         String?
  order         Order
  product       Product?
  variant       ProductVariant?
  menuItem      MenuItem?
  service       Service?
}
```

---

## 3. Parcours utilisateur

### 3.1 Passage de commande (Client)

```
1. Navigation sur la page business publique
2. Ajout au panier (depuis la section Produits/Services/Menu)
3. Visualisation du panier (récapitulatif, modification quantités)
4. Application code promo (coupon)
5. Checkout :
   a. Contact (nom, téléphone, email)
   b. Adresse de livraison (si produit physique)
   c. Date/heure souhaitée (si service)
   d. Mode de paiement (Mobile Money, Carte, Cash, Escrow)
6. Confirmation → écran de succès avec numéro de commande
7. Le client reçoit une notification "Commande confirmée"
```

### 3.2 Gestion de commande (Business)

```
1. Notification "Nouvelle commande #{number}"
2. Dashboard → Commandes → voir la liste (filtrée par statut)
3. Actions possibles :
   └─ Accepter la commande
   └─ Refuser (avec motif)
   └─ Marquer "En préparation"
   └─ Marquer "Prêt"
   └─ Marquer "Livré" / "Terminé"
4. Timeline visible pour le client à chaque étape
```

### 3.3 Commande via QR Menu (Restaurant)

```
1. Client scanne le QR code sur la table
2. Menu du restaurant s'affiche (sans auth)
3. Client sélectionne les plats
4. Validation → commande envoyée à la cuisine
5. Le restaurant reçoit la commande avec numéro de table
6. Préparation → notification "Prêt" → service à table
```

---

## 4. Routes API

### Panier

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/api/cart` | auth | Mon panier |
| POST | `/api/cart/items` | auth | Ajouter item |
| PUT | `/api/cart/items/:id` | auth | Modifier quantité |
| DELETE | `/api/cart/items/:id` | auth | Supprimer item |
| DELETE | `/api/cart` | auth | Vider le panier |
| POST | `/api/cart/coupon` | auth | Appliquer coupon |

### Commandes (Client)

| Méthode | Route | Middleware |
|---------|-------|-----------|
| POST | `/api/orders` | auth | Créer commande |
| GET | `/api/orders` | auth | Mes commandes |
| GET | `/api/orders/:id` | auth | Détail commande |
| POST | `/api/orders/:id/cancel` | auth | Annuler commande |

### Commandes (Business)

| Méthode | Route | Middleware |
|---------|-------|-----------|
| GET | `/api/business/orders` | auth, BUSINESS | Commandes reçues |
| GET | `/api/business/orders/:id` | auth, BUSINESS | Détail |
| POST | `/api/business/orders/:id/accept` | auth, BUSINESS | Accepter |
| POST | `/api/business/orders/:id/refuse` | auth, BUSINESS | Refuser |
| POST | `/api/business/orders/:id/preparing` | auth, BUSINESS | En préparation |
| POST | `/api/business/orders/:id/ready` | auth, BUSINESS | Prêt |
| POST | `/api/business/orders/:id/deliver` | auth, BUSINESS | Livrer |
| POST | `/api/business/orders/:id/complete` | auth, BUSINESS | Terminer |

---

## 5. Pages & Composants

| Page | Route |
|------|-------|
| Panier | `/dashboard/cart` |
| Checkout | `/dashboard/cart/checkout` |
| Mes commandes | `/dashboard/orders` |
| Commande (détail) | `/dashboard/orders/[id]` |
| Commandes reçues | `/dashboard/business/orders` |
| Statistiques commandes | `/dashboard/orders/stats` |

### Composants

| Composant | Rôle |
|-----------|------|
| `cart/CartDrawer` | Drawer latéral du panier |
| `cart/CartIcon` | Icône panier (badge quantité) |
| `orders/OrderTimeline` | Timeline visuelle des statuts |
| `orders/OrderActionModal` | Modal actions business |
| `orders/WhatsAppShare` | Partage commande via WhatsApp |

---

## 6. Règles métier

- **RB-01** : Un seul panier actif par utilisateur
- **RB-02** : Le panier est vidé après création de commande
- **RB-03** : Un coupon ne s'applique que si les conditions sont remplies (minAmount, date...)
- **RB-04** : Le numéro de commande est auto-généré : `CMD-YYYYMMDD-NNNNN`
- **RB-05** : Une commande peut être annulée par le client si statut = PENDING
- **RB-06** : Une fois CONFIRMED, seule le business peut annuler
- **RB-07** : Le stock des produits est décrémenté à la confirmation, pas à la création

---

## 7. Permissions & Rôles

| Action | GUEST | CLIENT | BUSINESS | ADMIN |
|--------|-------|--------|----------|-------|
| Voir catalogue | ✓ | ✓ | ✓ | ✓ |
| Ajouter panier | — | ✓ | ✓ | — |
| Commander | — | ✓ | ✓ | — |
| Voir commandes reçues | — | — | ✓ | ✓ |
| Gérer statut commande | — | — | ✓ | ✓ |
| Voir toutes commandes | — | — | — | ✓ |

---

## 8. Notifications

| Événement | Canal |
|-----------|-------|
| Commande créée (business) | In-app + Email |
| Commande confirmée (client) | In-app + Email |
| Commande refusée (client) | In-app |
| Commande prête (client) | In-app + WhatsApp |
| Commande livrée (client) | In-app |
| Commande annulée (client) | In-app + Email |
| Commande annulée (business) | In-app |

---

## 9. Critères d'acceptation

| AC | Critère |
|----|---------|
| AC-04-01 | Ajout produit au panier → quantité + prix corrects |
| AC-04-02 | Application coupon → réduction calculée |
| AC-04-03 | Checkout → commande créée, panier vidé |
| AC-04-04 | Statuts de commande : PENDING → CONFIRMED → PREPARING → READY → DELIVERED |
| AC-04-05 | Timeline visible par le client |
| AC-04-06 | Annulation possible par le client (PENDING) |
| AC-04-07 | Stock décrémenté à la confirmation |
| AC-04-08 | QR Menu → commande avec numéro de table |
| AC-04-09 | Notifications reçues à chaque changement de statut |