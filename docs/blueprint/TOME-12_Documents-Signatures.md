# TOME-12 — Documents & Signatures

> **Couche Business** — Gestion documentaire et signature électronique
> Statut : Référence | Priorité : Moyenne

**Modèles :** BusinessDocument, DocumentSignature

**Parcours utilisateur :**
1. Business téléverse un document (devis, contrat, facture, rapport)
2. Envoi d'une demande de signature à un client/partenaire
3. Le destinataire reçoit un lien unique (token)
4. Signature électronique (dessin, clic, ou saisie)
5. Document signé verrouillé + horodaté
6. Archivage sécurisé

**Règles métier :**
- RB-01 : Le token de signature expire après 7 jours
- RB-02 : Un document signé est verrouillé (plus de modifications)
- RB-03 : L'IP et le user-agent du signataire sont enregistrés
- RB-04 : Les documents sont stockés sur le serveur (uploads/) avec backup

**Pages :** `dashboard/documents/`, `signatures/`, `public/sign/[token]`

**AC :** Upload document → envoi signature → signature (token) → verrouillage