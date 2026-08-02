# TOME-05 — Réservations, Chambres, Locations & Événements

> **Couche Business** — Gestion des prestations basées sur le temps
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Permettre aux businesses de gérer les prestations liées à une date/heure : réservations de services, chambres d'hôtel, locations de matériel, et billetterie d'événements.

**Problème résolu :** Un coiffeur veut gérer ses rendez-vous, un hôtel ses chambres, un loueur son matériel, un promoteur ses billets d'événement.

**Valeur ajoutée :**
- Calendrier unifié des réservations
- Créneaux horaires configurables
- Types multiples (service, chambre, location, événement)
- Rappels automatiques

---

## 2. Modèles de données

### Réservations

```
Booking {
  id                  String        @id @default(uuid())
  bookingNumber       String        @unique
  businessId          String?
  clientId            String
  providerId          String?       // Employé assigné
  title               String
  description         String?
  type                BookingType   // SERVICE, ROOM, RENTAL, EVENT, RESOURCE
  source              BookingSource // AFRIBIZ_SITE, WHATSAPP, WALK_IN, API
  status              BookingStatus // PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS,
                                    // COMPLETED, CANCELLED, NO_SHOW
  isWalkIn            Boolean       @default(false)
  serviceId           String?
  roomId              String?
  rentalId            String?
  resourceId          String?
  startDate           DateTime
  endDate             DateTime?
  checkIn             DateTime?
  checkOut            DateTime?
  guests              Int           @default(1)
  adults              Int?
  children            Int?
  numberOfPeople      Int           @default(1)
  customerName        String
  customerPhone       String
  customerEmail       String?
  location            String?
  specialRequests     String?
  notes               String?
  price               Decimal       @db.Decimal(12, 2)
  currency            String        @default("FCFA")
  depositAmount       Decimal?      @db.Decimal(12, 2)
  depositPaid         Boolean       @default(false)
  refundAmount        Decimal?      @db.Decimal(12, 2)
  cancellationPolicy  String?
  cancellationFee     Decimal?      @db.Decimal(12, 2)
  cancelledAt         DateTime?
  cancelReason        String?
  checkedInAt         DateTime?
  checkedOutAt        DateTime?
  noShowAt            DateTime?
  isNoShow            Boolean       @default(false)
  remindedAt          DateTime?
  reminderSent        Boolean       @default(false)
  deletedAt           DateTime?
  // Relations
  business            Business?
  client              User          @relation("ClientBookings")
  provider            User?         @relation("ProviderBookings")
  service             Service?
  room                Room?
  rental              Rental?
  resource            BookingResource?
  reminders           BookingReminder[]
  payments            Payment[]
  planningTasks       PlanningTask[]
}

BookingResource {
  id          String
  businessId  String
  name        String    // ex: "Salle de réunion A", "Équipement vidéo"
  type        String?
  description String?
  capacity    Int?
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  business    Business
  bookings    Booking[]
  timeSlots   TimeSlot[]
}

TimeSlot {
  id            String
  businessId    String
  resourceId    String?
  dayOfWeek     Int       // 0-6
  startTime     String    // "08:00"
  endTime       String    // "12:00"
  isAvailable   Boolean   @default(true)
  maxCapacity   Int?
  slotDuration  Int?      // minutes
  bufferTime    Int?      // minutes entre deux slots
  isActive      Boolean   @default(true)
  business      Business
  resource      BookingResource?
}
```

### Chambres, Locations, Événements

Voir modèles dans le Prisma schema :
- **Room** : id, businessId, name, type, price, capacity, amenities, images, isAvailable
- **Rental** : id, businessId, name, price, unit, deposit, quantity, availableQty
- **Event** : id, businessId, title, startDate, endDate, capacity, price, tickets, participants
- **EventTicket** : id, eventId, name, price, quantity, saleStartAt, saleEndAt
- **EventParticipant** : id, eventId, ticketId, firstName, lastName, email, phone, qrCode, checkedInAt

---

## 3. Parcours utilisateur

### Réservation de service

```
Client → Page publique business → Section Services
  1. Sélectionne un service
  2. Choisit une date dans le calendrier de disponibilité
  3. Choisit un créneau horaire
  4. Sélectionne un employé (optionnel)
  5. Renseigne nom, téléphone, email
  6. Ajoute des notes / demandes spéciales
  7. Confirme → réservation créée (PENDING ou CONFIRMED selon autoConfirm)
  8. Reçoit notification de confirmation ou d'attente
```

### Réservation de chambre d'hôtel

```
Client → Page publique business → Section Chambres
  1. Sélectionne une chambre
  2. Choisit date d'arrivée et date de départ
  3. Nombre d'adultes/enfants
  4. Prix calculé (nombre de nuits × prix)
  5. Options (petit-déjeuner, lit supplémentaire…)
  6. Confirmation
```

### Achat de billet d'événement

```
Client → Page événement publique
  1. Sélectionne un ticket (Standard, VIP, VVIP)
  2. Quantité
  3. Remplit les informations des participants
  4. Paiement
  5. QR code généré
  6. Scan à l'entrée
```

---

## 4. Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/bookings` | Mes réservations (client) |
| POST | `/api/bookings` | Créer réservation |
| GET | `/api/bookings/:id` | Détail réservation |
| POST | `/api/bookings/:id/cancel` | Annuler réservation |
| GET | `/api/business/bookings` | Réservations reçues (business) |
| POST | `/api/business/bookings/:id/confirm` | Confirmer |
| POST | `/api/business/bookings/:id/cancel` | Annuler (business) |
| POST | `/api/business/bookings/:id/checkin` | Check-in |
| POST | `/api/business/bookings/:id/checkout` | Check-out |
| POST | `/api/business/bookings/:id/noshow` | Marquer no-show |
| GET | `/api/business/bookings/calendar` | Calendrier réservations |
| GET | `/api/business/bookings/stats` | Statistiques |
| GET | `/api/business/bookings/reminders` | Rappels configurés |
| POST | `/api/business/bookings/reminders` | Configurer rappel |
| GET | `/api/business/bookings/resources` | Ressources |
| POST | `/api/business/bookings/resources` | Créer ressource |
| GET | `/api/business/bookings/slots` | Créneaux horaires |
| POST | `/api/business/bookings/slots` | Configurer créneau |
| GET/POST/PUT/DELETE | `/api/business/rooms/*` | Gestion chambres |
| GET/POST/PUT/DELETE | `/api/business/rentals/*` | Gestion locations |
| GET/POST/PUT/DELETE | `/api/business/events/*` | Gestion événements |

### Routes publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/public/businesses/:slug/booking-info` | Infos réservation (services, ressources, créneaux) |
| POST | `/api/public/bookings` | Créer réservation (publique, sans auth) |
| GET | `/api/events/:slug` | Page publique événement |
| GET | `/api/events/:slug/:eventId` | Détail événement |

---

## 5. Pages & Composants

| Page | Route |
|------|-------|
| Réservations (dashboard) | `/dashboard/bookings` |
| Réservation (détail) | `/dashboard/bookings/[id]` |
| Nouvelle réservation | `/dashboard/bookings/new` |
| Calendrier | `/dashboard/bookings/calendar` |
| Créneaux | `/dashboard/bookings/slots` |
| Ressources | `/dashboard/bookings/resources` |
| Rappels | `/dashboard/bookings/reminders` |
| Statistiques | `/dashboard/bookings/stats` |
| Chambres | `/dashboard/rooms` |
| Locations | `/dashboard/rentals` |
| Événements | `/dashboard/events` |

### Composants

| Composant | Rôle |
|-----------|------|
| `business-public/sections/Bookings.tsx` | Section réservation publique |
| `business-public/sections/Rooms.tsx` | Section chambres publique |
| `business-public/sections/Rentals.tsx` | Section locations publique |
| `business-public/sections/Events.tsx` | Section événements publique |

---

## 6. Règles métier

- **RB-01** : Un créneau n'est proposé que s'il est disponible (pas de conflit)
- **RB-02** : BufferTime ajouté entre deux réservations sur la même ressource
- **RB-03** : Une chambre ne peut être réservée deux fois sur la même période
- **RB-04** : Le prix d'une chambre varie selon la saison (weekend, haute saison)
- **RB-05** : Un événement ne vend pas plus de billets que sa capacité
- **RB-06** : Le QR code du billet est unique et vérifiable
- **RB-07** : No-show automatique si pas de check-in 30 min après le début
- **RB-08** : Rappel envoyé 24h avant la réservation

---

## 7. Permissions & Rôles

| Action | GUEST | CLIENT | BUSINESS | ADMIN |
|--------|-------|--------|----------|-------|
| Voir disponibilités | ✓ | ✓ | ✓ | ✓ |
| Créer réservation | — | ✓ | ✓ | ✓ |
| Gérer réservations | — | — | ✓ | ✓ |
| CRUD chambres | — | — | ✓ | ✓ |
| CRUD événements | — | — | ✓ | ✓ |
| CRUD locations | — | — | ✓ | ✓ |
| Scanner QR événement | — | — | — | ✓ |

---

## 8. Notifications

| Événement | Canal |
|-----------|-------|
| Nouvelle réservation (business) | In-app + Email |
| Réservation confirmée (client) | In-app + Email |
| Réservation annulée (client) | In-app |
| Rappel J-1 réservation (client) | WhatsApp + Email |
| No-show (business) | In-app |
| Check-in effectué (business) | In-app |
| Billet acheté (client) | Email (QR code joint) |
| Rappel événement J-1 (client) | Email + WhatsApp |

---

## 9. Critères d'acceptation

| AC | Critère |
|----|---------|
| AC-05-01 | Création réservation → créneaux disponibles |
| AC-05-02 | Conflit de créneau → message d'erreur |
| AC-05-03 | Réservation en attente → autoConfirm gère |
| AC-05-04 | Calendrier business affiche toutes les réservations |
| AC-05-05 | Réservation chambre → prix calculé (nuits × tarif) |
| AC-05-06 | Billet événement → QR unique téléchargeable |
| AC-05-07 | Scan QR → check-in validé + doublon détecté |
| AC-05-08 | Rappel automatique J-24h |
| AC-05-09 | No-show automatique après 30 min |
| AC-05-10 | Réservation publique (sans auth) fonctionne |