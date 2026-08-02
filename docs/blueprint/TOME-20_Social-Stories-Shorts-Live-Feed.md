# TOME-20 — Social (Stories, Shorts, Live, Feed, Posts, Offres Flash)

> **Couche Marketing** — Contenu engageant et viral
> Statut : Référence | Priorité : Moyenne

**Modèles :** Story, StoryView, Short, ShortLike, ShortComment, ShortView, ShortSave, Live, LiveProduct, LiveParticipant, LiveChat, LiveReaction, FeedItem, Post, PostLike, Follow, OfferFlash, ClaimedOffer

**Fonctionnalités :**

### Stories
- Contenu éphémère (24h) : photo, vidéo, lien
- Highlights (stories épinglées)
- Vue par vue, statistiques
- Pages : `dashboard/stories/`

### Shorts
- Vidéos courtes (15-60 sec) avec lien vers produit/service
- Likes, commentaires, partages, sauvegardes
- Fil d'actualité type TikTok
- Pages : `dashboard/shorts/`

### Live
- Streaming en direct avec vente de produits intégrée
- Chat en direct, réactions, participants
- Paiement escrow pendant le live
- Pages : `dashboard/lives/`

### Offres Flash
- Promotions géolocalisées (latitude, longitude, rayon km)
- Quantité limitée, temps limité
- QR code pour claim en boutique
- Pages : `dashboard/offers/`

### Feed & Posts
- Fil d'actualité du business
- Posts : article, offre, événement
- Likes, partages
- Pages : `dashboard/feed/`, `dashboard/posts/`

### Follow
- Les clients peuvent suivre un business
- Le fil d'actualité du client montre les posts des businesses suivis

**Règles métier :**
- RB-01 : Story expire après 24h (sauf highlight)
- RB-02 : Live max 4h, peut être programmé
- RB-03 : Offre Flash : max 1 claim par client
- RB-04 : Shorts : 15-60 secondes, format vertical

**AC :** Création story → vue → highlight ; Live → stream → vente ; Offre Flash → géoloc → claim