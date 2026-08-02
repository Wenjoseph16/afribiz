# TOME-27 — Localisation & Multilingue

> **Couche Intelligence** — Adaptation linguistique et régionale
> Statut : Référence | Priorité : Moyenne

**Modèles :** Translation, TranslationKey, Region, Country, City

**Langues supportées :**
- Français (fr)
- Anglais (en)
- Portugais (pt)
- Arabe (ar) — Afrique du Nord
- Swahili (sw) — Afrique de l'Est
- Wolof, Bambara, Peul — Afrique de l'Ouest (v2)

**Pays supportés :**
| Région | Pays | Devise | MOBILE_MONEY |
|--------|------|--------|--------------|
| Afrique de l'Ouest | Bénin, Burkina, Côte d'Ivoire, Guinée, Mali, Niger, Sénégal, Togo | FCFA | Wave, TMoney, Flooz, Moov, Orange Money |
| Afrique Centrale | Cameroun, Congo, Gabon, RCA, Tchad | FCFA | MTN MoMo, Orange Money |
| Afrique de l'Est | Kenya, Ouganda, Tanzanie, Rwanda | KES, UGX, TZS, RWF | M-Pesa, Airtel Money |
| Afrique du Nord | Maroc, Tunisie, Algérie | MAD, TND, DZD | — |
| Afrique Australe | Mozambique, Angola | MZN, AOA | M-Pesa, EMIS |

**Fonctionnalités :**
- Traduction automatique via i18n (next-i18next)
- Clés de traduction dans `/locales/{lang}/common.json`
- Détection automatique de la langue du navigateur
- Changement de langue en un clic
- Formules de date/heure localisées
- Format monétaire localisé (espacement, symbole)
- Adresse formatée par pays

**Pages :** traduction intégrée sur toutes les pages via `useTranslation()`

**AC :** Détection langue → clés chargées → UI localisée → changement de région/devise