# TOME-26 — Notifications & Alerting

> **Couche Intelligence** — Système de notifications omni-canal
> Statut : Référence | Priorité : Haute

**Modèles :** NotificationTemplate, BusinessAlert

**Canaux de notification :**
1. **Email** : confirmations, factures, relances
2. **WhatsApp** : messages de service, confirmation commande (Twilio/API WhatsApp Business)
3. **SMS** : OTP, alertes critiques
4. **In-app** : notifications dans l'application
5. **Push** : navigateur (Web Push API)

**Types de notifications par rôle :**

| Événement | Client | Business | Employé | Admin |
|-----------|--------|----------|---------|-------|
| Commande confirmée | ✅ | ✅ | ✅ | — |
| Paiement reçu | ✅ | ✅ | — | — |
| Livraison en route | ✅ | ✅ | ✅ | — |
| Nouvel avis | — | ✅ | — | — |
| Réservation confirmée | ✅ | ✅ | ✅ | — |
| Litige ouvert | ✅ | ✅ | — | ✅ |
| Paiement en retard | ✅ | ✅ | — | — |
| Client inactif 30j | — | ✅ | — | — |
| Promotion bientôt expirée | — | ✅ | — | — |

**Templates :** templates HTML/WhatsApp paramétrables

**Pages :** `dashboard/settings/notifications/`, `dashboard/notifications/`

**AC :** Événement → template → envoi canal → délivrance → historique