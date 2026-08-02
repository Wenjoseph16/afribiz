# TOME-03 — Produits, Services, Menu & Formations

> **Couche Business** — Catalogue des offres commerciales du business
> Statut : Référence | Priorité : Critique

---

## 1. Objectifs métier

Permettre à chaque business de créer et gérer son catalogue complet de ce qu'il vend : produits physiques, prestations de services, menus de restaurant, et formations avec leçons & quiz.

**Problème résolu :** Chaque type de business a un catalogue différent. Un restaurant a un menu, une boutique a des produits avec stocks, un coiffeur a des services avec durée, un formateur a des cours avec vidéos.

**Valeur ajoutée :**
- Types de catalogue adaptés au métier (produits, services, menu, formations)
- Gestion des stocks, variantes, prix promotionnels
- Catégories hiérarchiques (parents/enfants)
- QR Menu pour les restaurants (sans app)

---

## 2. Modèles de données

### Produits

```
Product {
  id                  String    @id @default(uuid())
  businessId          String?
  sellerId            String    // User (seller)
  categoryId          String?   // ProductCategory
  name                String
  slug                String    @unique
  description         String?
  shortDescription    String?
  brand               String?
  price               Decimal   @db.Decimal(12, 2)
  currency            String    @default("FCFA")
  comparePrice        Decimal?  @db.Decimal(12, 2) // Prix barré
  costPrice           Decimal?  @db.Decimal(12, 2) // Prix de revient
  images              String[]  // URLs
  video               String?
  tags                String[]
  stock               Int       @default(0)
  lowStockThreshold   Int       @default(5)
  sku                 String?
  barcode             String?
  weight              Float?
  weightUnit           String?
  unit                String?
  dimensions          String?
  deliveryFee         Decimal?  @db.Decimal(12, 2)
  isActive            Boolean   @default(true)
  isPhysical          Boolean   @default(true)
  hasVariants         Boolean   @default(false)
  isOnPreOrder        Boolean   @default(false)
  isPromotional       Boolean   @default(false)
  promotionalPrice    Decimal?  @db.Decimal(12, 2)
  discountPercent     Float?
  promotionEndsAt     DateTime?
  featured            Boolean   @default(false)
  sortOrder           Int       @default(0)
  rating              Float     @default(0)
  reviewCount         Int       @default(0)
  orderCount          Int       @default(0)
  seoTitle            String?
  seoDescription      String?
  deletedAt           DateTime?

  // Relations
  business            Business?  @relation(fields: [businessId], references: [id])
  seller              User       @relation("SellerProducts", fields: [sellerId], references: [id])
  category            ProductCategory?
  variants            ProductVariant[]
  reviews             Review[]
  favorites           Favorite[]   @relation("ProductFavorites")
  orderItems          OrderItem[]
  cartItems           CartItem[]
}

ProductCategory {
  id          String
  businessId  String
  name        String
  slug        String
  description String?
  icon        String?
  image       String?
  parentId    String?
  sortOrder   Int
  isActive    Boolean
  deletedAt   DateTime?
  // Relations
  parent      ProductCategory? @relation("ProductCategoryParent")
  children    ProductCategory[] @relation("ProductCategoryParent")
  products    Product[]
}

ProductVariant {
  id        String
  productId String
  name      String    // ex: "Taille M", "Couleur Rouge"
  sku       String?
  price     Decimal   @db.Decimal(12, 2)
  currency  String    @default("FCFA")
  stock     Int       @default(0)
  isActive  Boolean   @default(true)
}
```

### Services

```
Service {
  id                  String
  businessId          String
  categoryId          String?   // ServiceCategory
  name                String
  shortDescription    String?
  description         String?
  tags                String[]
  images              String[]
  video               String?
  price               Decimal?  @db.Decimal(12, 2)
  priceType           String?   // FIXED, FROM, VARIABLE
  minPrice            Decimal?  @db.Decimal(12, 2)
  currency            String    @default("FCFA")
  isPromotional       Boolean   @default(false)
  promotionalPrice    Decimal?  @db.Decimal(12, 2)
  discountPercent     Float?
  promotionEndsAt     DateTime?
  duration            Int?      // minutes
  durationMin         Int?
  durationMax         Int?
  availability        String?   // BUSINESS_HOURS, ANYTIME, APPOINTMENT
  bookingRequired     Boolean   @default(true)
  depositRequired     Boolean   @default(false)
  depositAmount       Decimal?  @db.Decimal(12, 2)
  autoConfirm         Boolean   @default(false)
  locationType        String?   // AT_BUSINESS, AT_CLIENT, REMOTE
  isActive            Boolean   @default(true)
  isVisibleOnPublicPage  Boolean @default(true)
  isVisibleOnMarketplace Boolean @default(false)
  featured            Boolean   @default(false)
  sortOrder           Int       @default(0)
  rating              Float     @default(0)
  reviewCount         Int       @default(0)
  bookingCount        Int       @default(0)
  deletedAt           DateTime?

  // Relations
  business            Business
  category            ServiceCategory?
  employees           ServiceEmployee[]
  reviews             Review[]
  bookings            Booking[]
  orderItems          OrderItem[]
  cartItems           CartItem[]
}

ServiceCategory {
  // Même structure que ProductCategory
  id, businessId, name, slug, description, icon, image, parentId, sortOrder, isActive, deletedAt
  // Relations : parent, children, services
}
```

### Menu Restaurant

```
MenuItem {
  id                String
  businessId        String
  categoryId        String?   // MenuCategory
  name              String
  description       String?
  shortDescription  String?
  type              MenuItemType  // DISH, BEVERAGE, DESSERT, SIDE, COMBO
  images            String[]
  video             String?
  tags              String[]
  price             Decimal   @db.Decimal(12, 2)
  currency          String    @default("FCFA")
  isPromotional     Boolean   @default(false)
  promotionalPrice  Decimal?  @db.Decimal(12, 2)
  discountPercent   Float?
  promotionEndsAt   DateTime?
  prepTime          Int?      // minutes
  cookTime          Int?      // minutes
  calories          Int?
  allergens         String[]
  hasVariants       Boolean   @default(false)
  status            MenuItemStatus // AVAILABLE, UNAVAILABLE, DISCONTINUED
  isAvailable       Boolean   @default(true)
  isActive          Boolean   @default(true)
  isPopular         Boolean   @default(false)
  isStar            Boolean   @default(false)
  featured          Boolean   @default(false)
  sortOrder         Int       @default(0)
  seoTitle          String?
  seoDescription    String?
  rating            Float     @default(0)
  reviewCount       Int       @default(0)
  orderCount        Int       @default(0)
  deletedAt         DateTime?

  // Relations
  business          Business
  category          MenuCategory?
  variants          MenuItemVariant[]
  ingredients       Ingredient[] @relation("MenuItemIngredients")
  orderItems        OrderItem[]
}

MenuCategory {
  // Même structure, hiérarchique
}

MenuItemVariant {
  id          String
  menuItemId  String
  name        String   // ex: "Grand format", "Avec supplément"
  price       Decimal  @db.Decimal(12, 2)
  currency    String   @default("FCFA")
  isAvailable Boolean  @default(true)
}

Ingredient {
  id          String
  businessId  String
  name        String
  unit        String?
  stock       Float?
  minStock    Float?
  isActive    Boolean  @default(true)
  menuItems   MenuItem[] @relation("MenuItemIngredients")
}

RestaurantTable {
  id          String
  businessId  String
  number      Int
  capacity    Int?
  location    String?
  isAvailable Boolean  @default(true)
  isActive    Boolean  @default(true)
  menuOrders  MenuOrder[]
}

MenuOrder {
  id          String
  businessId  String
  tableId     String?
  status      String
  items       Json
  total       Decimal   @db.Decimal(12, 2)
  notes       String?
  table       RestaurantTable?
}
```

### Formations

```
Training {
  id          String    @id @default(uuid())
  title       String
  description String?
  category    String?
  duration    Int?      // minutes total
  lessons     Int       @default(0)
  price       Decimal?  @db.Decimal(12, 2) // 0 = gratuite
  currency    String    @default("FCFA")
  businessId  String?
  image       String?
  coverVideo  String?
  level       String?   // DEBUTANT, INTERMEDIAIRE, AVANCE
  isPublished Boolean   @default(false)
  deletedAt   DateTime?
  business    Business?
  enrollments UserTraining[]
  lessonList  TrainingLesson[]
}

TrainingLesson {
  id          String    @id @default(uuid())
  trainingId  String
  title       String
  description String?
  content     String?   // Markdown / HTML
  videoUrl    String?
  duration    Int?      // minutes
  sortOrder   Int       @default(0)
  isFree      Boolean   @default(false) // Aperçu gratuit
  training    Training
  quizzes     TrainingQuiz[]
}

TrainingQuiz {
  id            String    @id @default(uuid())
  lessonId      String
  title         String
  description   String?
  passingScore  Int       @default(70) // %
  maxAttempts   Int       @default(3)
  timeLimit     Int?      // minutes
  lesson        TrainingLesson
  questions     QuizQuestion[]
  attempts      UserQuizAttempt[]
}

QuizQuestion {
  id            String    @id @default(uuid())
  quizId        String
  question      String
  options       Json      // [{text: "...", isCorrect: boolean}]
  explanation   String?
  sortOrder     Int       @default(0)
  quiz          TrainingQuiz
}

UserQuizAttempt {
  id            String    @id @default(uuid())
  userId        String
  quizId        String
  score         Int
  totalQuestions Int
  answers       Json
  passed        Boolean
  completedAt   DateTime?
  user          User
  quiz          TrainingQuiz
}

UserTraining {
  id            String    @id @default(uuid())
  userId        String
  trainingId    String
  status        TrainingStatus  // NOT_STARTED, IN_PROGRESS, COMPLETED
  progress      Int       @default(0) // %
  certificateUrl String?
  isPaid        Boolean   @default(false)
  paidAt        DateTime?
  amountPaid    Decimal?  @db.Decimal(12, 2)
  completedAt   DateTime?
  user          User
  training      Training
}
```

---

## 3. Parcours utilisateur

### 3.1 Gestion des produits

```
Business → Dashboard → Produits
  1. Liste des produits (recherche, filtre par catégorie/statut)
  2. Création :
     a. Nom, description, images (upload multiple)
     b. Prix, devise, comparaison (prix barré)
     c. Stock, SKU, variantes (taille, couleur…)
     d. Catégorie, tags, SEO
     e. Options livraison (frais, poids, dimensions)
     f. Promotion (prix promo, dates)
  3. Publication : visible sur la page publique

Cas particulier : Stock épuisé
  → Le produit est marqué "Rupture" sur la page publique
  → Option "Pré-commande" possible
  → Alerte au business quand stock < lowStockThreshold
```

### 3.2 Gestion des services

```
Business → Dashboard → Services
  Similaire aux produits, avec en plus :
  - Durée (minutes, ou intervalle min-max)
  - Type de prix (fixe, à partir de, variable)
  - Disponibilité (heures d'ouverture, sur rendez-vous)
  - Dépôt requis (montant)
  - Confirmation automatique
  - Lieu (chez le business, chez le client, à distance)
  - Employés assignés au service
```

### 3.3 Gestion du menu restaurant

```
Business → Dashboard → Menu
  1. Catégories (Entrées, Plats, Desserts, Boissons…)
  2. Items avec :
     - Type (plat, boisson, dessert, accompagnement, combo)
     - Images, description, tags (allergènes, calories)
     - Variantes (taille, supplément)
     - Ingrédients liés (stock)
  3. QR Menu → lien public /menu/business-slug
  4. Commandes table (scan QR → commande → cuisine)
```

### 3.4 Gestion des formations

```
Business → Dashboard → Formations
  1. Créer une formation : titre, description, prix, catégorie, niveau
  2. Ajouter des leçons (vidéo + contenu + quiz)
  3. Publier → visible sur la page publique du business
  4. Suivi des inscriptions (utilisateurs inscrits)
  5. Délivrance de certificat (quand toutes les leçons terminées)

Client → Parcours d'apprentissage
  1. Découvre la formation (page publique business ou marketplace)
  2. S'inscrit (gratuite) ou achète (payante)
  3. Suit les leçons dans l'ordre
  4. Passe les quiz (note minimale pour valider)
  5. Obtient un certificat téléchargeable
```

---

## 4. Routes API

### Produits

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/api/business/products` | auth, BUSINESS | Mes produits |
| POST | `/api/business/products` | auth, BUSINESS | Créer produit |
| GET | `/api/business/products/:id` | auth, BUSINESS | Détail produit |
| PUT | `/api/business/products/:id` | auth, BUSINESS | Modifier produit |
| DELETE | `/api/business/products/:id` | auth, BUSINESS | Supprimer (soft) |
| GET | `/api/business/products/categories` | auth, BUSINESS | Mes catégories |
| POST | `/api/business/products/categories` | auth, BUSINESS | Créer catégorie |
| PUT | `/api/business/products/categories/:id` | auth, BUSINESS | Modifier catégorie |
| DELETE | `/api/business/products/categories/:id` | auth, BUSINESS | Supprimer catégorie |
| GET | `/api/business/public/:slug/products` | — | Produits publics |

### Services

| Méthode | Route | Middleware |
|---------|-------|-----------|
| GET/POST/PUT/DELETE | `/api/business/services/*` | auth, BUSINESS |
| GET | `/api/business/public/:slug/services` | — |

### Menu

| Méthode | Route | Middleware |
|---------|-------|-----------|
| GET/POST/PUT/DELETE | `/api/business/menu/*` | auth, BUSINESS |
| GET | `/api/business/menu/ingredients` | auth, BUSINESS |
| POST | `/api/business/menu/orders` | auth, BUSINESS | Commande table |
| GET | `/api/business/menu/tables` | auth, BUSINESS |
| POST | `/api/business/menu/tables` | auth, BUSINESS |
| GET | `/api/business/public/:slug/menu` | — |

### Formations

| Méthode | Route | Middleware | Description |
|---------|-------|-----------|-------------|
| GET | `/api/trainings` | — | Formations publiques |
| GET | `/api/trainings/:id` | — | Détail formation |
| POST | `/api/trainings` | auth, BUSINESS | Créer formation |
| PUT | `/api/trainings/:id` | auth, BUSINESS | Modifier formation |
| DELETE | `/api/trainings/:id` | auth, BUSINESS | Supprimer formation |
| GET | `/api/trainings/:id/lessons` | auth, BUSINESS | Leçons d'une formation |
| POST | `/api/trainings/:id/lessons` | auth, BUSINESS | Ajouter leçon |
| PUT | `/api/trainings/lessons/:id` | auth, BUSINESS | Modifier leçon |
| DELETE | `/api/trainings/lessons/:id` | auth, BUSINESS | Supprimer leçon |
| POST | `/api/trainings/lessons/:id/quiz` | auth, BUSINESS | Ajouter quiz |
| PUT | `/api/trainings/quiz/:id` | auth, BUSINESS | Modifier quiz |
| POST | `/api/trainings/quiz/:id/questions` | auth, BUSINESS | Ajouter question |
| PUT | `/api/trainings/questions/:id` | auth, BUSINESS | Modifier question |
| DELETE | `/api/trainings/questions/:id` | auth, BUSINESS | Supprimer question |
| POST | `/api/trainings/:id/enroll` | auth, CLIENT | S'inscrire à une formation |
| GET | `/api/trainings/my` | auth, CLIENT | Mes formations suivies |
| PUT | `/api/trainings/progress/:id` | auth, CLIENT | Mettre à jour progression |
| POST | `/api/trainings/quiz/:id/attempt` | auth, CLIENT | Tenter un quiz |
| GET | `/api/trainings/certificate/:id` | auth, CLIENT | Télécharger certificat |
| PUT | `/api/trainings/advanced/*` | auth, ADMIN | Admin formations |

---

## 5. Pages & Composants

### Pages dashboard

| Page | Route |
|------|-------|
| Produits (liste) | `/dashboard/products` |
| Produit (détail) | `/dashboard/products/[id]` |
| Nouveau produit | `/dashboard/products/new` |
| Catégories produits | `/dashboard/products/categories` |
| Import produits | `/dashboard/products/import` |
| Alertes stock | `/dashboard/products/stock-alerts` |
| Services (liste) | `/dashboard/services` |
| Service (détail) | `/dashboard/services/[id]` |
| Catégories services | `/dashboard/services/categories` |
| Menu (liste) | `/dashboard/menu` |
| Menu item | `/dashboard/menu/[id]` |
| Catégories menu | `/dashboard/menu/categories` |
| Ingrédients | `/dashboard/menu/ingredients` |
| Tables | `/dashboard/menu/tables` |
| QR Menu | `/dashboard/menu/qr-menu` |
| Commandes table | `/dashboard/menu/orders` |
| Formations (liste) | `/dashboard/trainings` |
| Formation (détail) | `/dashboard/trainings/[id]` |
| Leçons | `/dashboard/trainings/lessons` |
| Gestion formation | `/dashboard/trainings/manage` |

### Pages publiques

| Page | Route | Composant |
|------|-------|-----------|
| Produit public | `/product/[slug]` | — |
| Page business (section Products) | `/business/[slug]` | `sections/Products.tsx` |
| Page business (section Services) | `/business/[slug]` | `sections/Services.tsx` |
| Page business (section Menu) | `/business/[slug]` | `sections/Menu.tsx` |
| Page business (section Trainings) | `/business/[slug]` | `sections/Trainings.tsx` |

---

## 6. Règles métier

- **RB-01** : Un slug de produit doit être unique globalement
- **RB-02** : Un produit avec stock = 0 est marqué "Rupture" (sauf si pre-order)
- **RB-03** : Les variantes héritent du prix produit si non spécifié
- **RB-04** : Un service avec bookingRequired = true nécessite une réservation
- **RB-05** : Le QR Menu régénère l'URL quand le menu change (cache bust)
- **RB-06** : Une formation peut être gratuite (price = 0) ou payante
- **RB-07** : Un certificat est délivré quand progression = 100% ET tous les quiz réussis
- **RB-08** : Les quiz ont un nombre max de tentatives (maxAttempts)
- **RB-09** : Un ingrédient lié à un menu item alerte quand stock < minStock

---

## 7. Permissions & Rôles

| Action | GUEST | CLIENT | BUSINESS | ADMIN |
|--------|-------|--------|----------|-------|
| Voir catalogue public | ✓ | ✓ | ✓ | ✓ |
| CRUD produits | — | — | ✓ | ✓ |
| CRUD services | — | — | ✓ | ✓ |
| CRUD menu | — | — | ✓ | ✓ |
| CRUD formations | — | — | ✓ | ✓ |
| S'inscrire formation | — | ✓ | ✓ | ✓ |
| Passer un quiz | — | ✓ | ✓ | ✓ |
| Gérer tous les catalogues | — | — | — | ✓ |

---

## 8. Notifications

| Événement | Canal | Template |
|-----------|-------|----------|
| Stock bas (< threshold) | In-app + Email | "Stock bas : {produit} ({stock} restants)" |
| Produit en rupture | In-app | "{produit} est en rupture de stock" |
| Nouvel avis produit | In-app | "Nouvel avis sur {produit}" |
| Nouvel avis service | In-app | "Nouvel avis sur {service}" |
| Formation complétée | In-app + Email | "Félicitations ! Formation {title} terminée" |
| Certificat délivré | In-app | "Votre certificat est disponible" |
| Étudiant inscrit (business) | In-app | "Nouvel inscrit à {formation}" |

---

## 9. Automatisations

| Règle | Déclencheur | Action |
|-------|------------|--------|
| Alerte stock bas | Quand stock < lowStockThreshold | Notification + email |
| Marquage rupture | Quand stock = 0 | isAvailable = false |
| Dépromotion auto | Quand promotionEndsAt dépassé | isPromotional = false |
| Calcul note moyenne | Après chaque nouvel avis | Recalcul rating du produit/service |
| Certificat automatique | Quand progression = 100% + quiz réussis | Génération certificat |
| Ordre par défaut | Nouvelle catégorie | sortOrder = max + 1 |

---

## 10. Critères d'acceptation

| AC | Critère |
|----|---------|
| AC-03-01 | Création produit → visible dans dashboard + page publique |
| AC-03-02 | Variantes fonctionnent (prix et stock indépendants) |
| AC-03-03 | Stock à 0 → badge "Rupture" sur page publique |
| AC-03-04 | Promotion avec date → désactivation automatique |
| AC-03-05 | Catégories hiérarchiques (parent/enfant) |
| AC-03-06 | Création service avec durée → bloqué dans calendrier réservation |
| AC-03-07 | QR Menu fonctionnel (scan → menu sans auth) |
| AC-03-08 | Commande table (scan → commander) |
| AC-03-09 | Création formation avec leçons + quiz |
| AC-03-10 | Inscription formation → progression suivie |
| AC-03-11 | Quiz réussi → note enregistrée |
| AC-03-12 | Toutes leçons + quiz OK → certificat généré |
| AC-03-13 | Export/import produits (CSV) |