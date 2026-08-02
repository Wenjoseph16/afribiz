# TOME-17 — Messages & Chat

> **Couche Client** — Communication en temps réel
> Statut : Référence | Priorité : Moyenne

**Modèles :** Conversation, ConversationParticipant, Message, MessageReaction

**Parcours :**
1. Client contacte un business (bouton "Contacter" sur la page publique)
2. Une conversation est créée
3. Messages texte + pièces jointes
4. Réactions (👍, ❤️, 😂) sur les messages
5. Socket.io temps réel (notifications de nouveaux messages)
6. Historique accessible depuis le dashboard

**Types de conversations :**
- CLIENT→BUSINESS : demande d'info, négociation
- BUSINESS→CLIENT : suivi commande, confirmation
- INTERNE : communication entre employés du même business

**Règles métier :**
- RB-01 : Les messages ne sont pas modifiables une fois envoyés
- RB-02 : Une conversation entre un client et un business est automatique (demande devis, commande)
- RB-03 : Les pièces jointes sont limitées à 10 Mo

**Pages :** `dashboard/messages/`, `dashboard/business/messages/`

**AC :** Envoi message → réception temps réel → historique