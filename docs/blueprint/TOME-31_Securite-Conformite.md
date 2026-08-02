# TOME-31 — Sécurité & Conformité

> **Couche Plateforme** — Sécurité, RGPD, et conformité réglementaire
> Statut : Référence | Priorité : Haute

---

## 1. Objectifs métier

Assurer la sécurité des données, la conformité aux réglementations (RGPD, lois africaines), et la confiance des utilisateurs.

---

## 2. Mesures de sécurité

### Authentification
- Hash bcrypt (coût 12) pour les mots de passe
- JWT (access 15 min + refresh 7 jours)
- 2FA (TOTP, SMS, Email)
- WebAuthn (biométrie, clé de sécurité)
- Rate limiting : 5 tentatives → blocage 15 min

### Données sensibles
- Chiffrement AES-256 pour données sensibles (RIB, identité)
- Pas de stockage de CVV
- Tokens d'accès Mobile Money en variable d'environnement
- Journalisation de toutes les accès aux données sensibles

### API
- Rate limiting (100 req/min standard, 500 premium)
- Validation entrées (express-validator + Zod)
- CORS restreint aux domaines autorisés
- Headers sécurité (Helmet)
- SQL injection : Prisma (paramétrage automatique)

### Sessions
- HttpOnly + Secure + SameSite=Strict pour cookies
- Regénération session après login
- Délai d'inactivité : 30 min

---

## 3. Conformité RGPD

- **Consentement** : Acceptation explicite CGU + politique confidentialité
- **Droit d'accès** : L'utilisateur peut télécharger ses données
- **Droit à l'oubli** : Suppression complète du compte (soft delete → anonymisation après 30 jours)
- **Portabilité** : Export JSON de toutes les données
- **DPO** : Contact dpo@afribiz.com
- **Cookies** : Bannière consentement (essentiels uniquement)
- **Données** : Minimisation, durée de conservation limitée

---

## 4. Règlementations africaines

- **Protection des données** : Lois nationales (Côte d'Ivoire, Sénégal, Bénin…)
- **Monnaie électronique** : Conformité BCEAO (FCFA), Banque Centrale (autres)
- **KYC** : Vérification d'identité pour transactions > 500 000 FCFA
- **Lutte anti-blanchiment** : Signalement transactions suspectes
- **Archivage** : Conservation 10 ans des données comptables

---

## 5. Plans de réponse aux incidents

| Niveau | Incident | Délai réponse | Actions |
|--------|----------|---------------|---------|
| P0 | Brèche de données, indisponibilité | < 15 min | Désactivation, notification équipe, analyse forensique |
| P1 | Erreurs de paiement, dégradation | < 1h | Correction prioritaire, rollback si nécessaire |
| P2 | Bugs non bloquants | < 24h | Correction dans le prochain sprint |
| P3 | Demande mineure | < 72h | Traitement normal |

**Communication :** Notification aux utilisateurs concernés sous 72h (RGPD), rapport d'incident documenté

---

## 6. Tests de sécurité

- **Test OWASP Top 10** : avant chaque release majeure
- **Pentest** : annuel par un cabinet externe
- **SAST** : ESLint + CodeQL dans CI/CD
- **DAST** : OWASP ZAP en staging
- **Dependency scanning** : `npm audit`, Dependabot
- **Secret scanning** : GitLeaks

---

**AC :** Auth sécurisé → chiffrement → conformité RGPD → plan incident → tests sécurité