# TOME-10 — Planning & Tâches

> **Couche Business** — Gestion des tâches opérationnelles
> Statut : Référence | Priorité : Moyenne

**Modèles :** PlanningTask, TaskCategory, TaskChecklist, TaskComment, TaskTimer, TaskResource, TaskValidation, PlanningLog

**Parcours utilisateur :**
1. Création tâche → assignation à un employé/partenaire
2. Checklist avec items validables
3. Minuteur intégré (lancer/arrêter)
4. Ressources attachées (photos, documents)
5. Validation requise (photo, signature)
6. Calendrier des tâches (vue jour/semaine/mois)

**Types de tâches :**
- Commande à préparer, à livrer
- Réservation à confirmer
- Entretien / ménage à planifier
- Événement à installer
- Tâche récurrente (quotidienne, hebdomadaire, mensuelle)

**Règles métier :**
- RB-01 : Une tâche peut être liée à une commande, réservation, événement, livraison, partenaire
- RB-02 : Les tâches récurrentes sont générées automatiquement par cron
- RB-03 : La validation peut nécessiter photo, signature, ou les deux
- RB-04 : Le chrono total est cumulé (somme des sessions Timer)

**Pages :** `dashboard/tasks/`, `tasks/[id]`, `tasks/new`, `dashboard/planning/`, `planning/calendar/`

**AC :** Création tâche → assignation → checklist → chrono → validation → complétée