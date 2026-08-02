# TOME-22 — Portfolio & Témoignages

> **Couche Marketing** — Vitrine des réalisations
> Statut : Référence | Priorité : Moyenne

**Modèles :** PortfolioCategory, PortfolioItem, PortfolioMedia, PortfolioInteraction, PortfolioTestimonial

**Parcours :**
1. Business crée des catégories de portfolio (Avant/Après, Réalisations, Projets)
2. Ajoute des items : photos, vidéos, description, budget, durée
3. Les visiteurs peuvent interagir (likes, commentaires)
4. Témoignages clients associés aux projets
5. Section visible sur la page publique business

**Cas d'usage :**
- Artisan : photos avant/après d'un meuble restauré
- Coiffeur : galerie de coiffures réalisées
- Décorateur : portfolio d'événements décorés
- Constructeur : photos de chantiers livrés

**Pages :** `dashboard/portfolio/`, `portfolio/categories/`, `portfolio/media/`, `portfolio/testimonials/`

**AC :** Création item portfolio → médias → interactions → témoignages