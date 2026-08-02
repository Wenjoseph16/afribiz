# TOME-08 — Livraisons

> **Couche Business** — Gestion des livraisons et tournées
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Permettre aux businesses de gérer la livraison de leurs commandes : zones, chauffeurs, tracking, preuve de livraison.

**Modèles :** Delivery, Driver, DeliveryZone, DeliveryTracking, DeliveryProof
**Parcours :** Commande → Assignation chauffeur → Prise en charge → Tracking → Livraison → Preuve (OTP/photo/signature)
**Permissions :** BUSINESS gère ses livraisons, CLIENT suit sa livraison
**Notifications :** Assignation chauffeur, Prise en charge, Arrivée imminente, Livrée
**AC :** Création livraison, tracking temps réel, OTP livré, signature