# TOME-21 — Publicité (Ads)

> **Couche Marketing** — Plateforme publicitaire interne
> Statut : Référence | Priorité : Moyenne

**Modèles :** AdPackage, AdSlot, AdCampaign, AdCreative, AdImpression, AdClick, AdConversion, AdInvoice

**Packages publicitaires :**
| Package | Prix | Durée | Placements |
|---------|------|-------|------------|
| Découverte | 10 000 FCFA | 24h | Bannière page business |
| Standard | 25 000 FCFA | 48h | Bannière + sidebar + carrousel |
| Premium | 100 000 FCFA | 48h | Toutes positions + homepage |
| Développeur Boost | 35 000 FCFA | 48h | Marketplace développeur |
| Externe Pro | 100 000 FCFA | 48h | Tout l'écosystème |

**Parcours :**
1. Business choisit un package (ou crée une campagne personnalisée)
2. Sélectionne les pages/positions cibles
3. Téléverse les créatifs (images, vidéo, bannière, CTA)
4. Paiement → campagne activée
5. Suivi : impressions, clics, conversions
6. Facture générée

**Pages :** `dashboard/ads/`, `ads/[id]`, `ads/new`

**AC :** Création campagne → ciblage → diffusion → tracking → facture