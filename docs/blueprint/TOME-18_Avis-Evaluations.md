# TOME-18 — Avis & Évaluations

> **Couche Client** — Système de réputation
> Statut : Référence | Priorité : Moyenne

**Modèles :** Review, BusinessReview, BusinessScore

**Parcours :**
1. Après une commande ou réservation, le client peut laisser un avis
2. Note sur 5 étoiles + commentaire + photos (optionnelles)
3. Le business peut répondre à l'avis
4. La note moyenne est calculée et affichée sur la page publique
5. L'AfriScore utilise la note comme facteur

**Règles métier :**
- RB-01 : Un avis ne peut être laissé que par un client ayant effectué une transaction
- RB-02 : Un business peut signaler un avis abusif (modération admin)
- RB-03 : La réponse du business est visible en dessous de l'avis
- RB-04 : Les notes sont arrondies à 0.5 près sur la page publique

**Pages :** `dashboard/reviews/`, business reviews section

**AC :** Achat → avis posté → réponse business → modération si abusif