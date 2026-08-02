# TOME-09 — Employés & RH

> **Couche Business** — Gestion des ressources humaines
> Statut : Référence | Priorité : Moyenne

---

## 1. Objectifs métier

Permettre aux businesses de gérer leur personnel : pointage, planning, paie, congés, performances.

**Modèles :** Employee, EmployeeRole, Attendance, EmployeeSchedule, Payroll, Leave, EmployeeDocument, EmployeePerformance, EmployeeActivity

**Parcours :**
- Embaucher → Créer un employé avec rôle et permissions
- Pointage → L'employé clock-in/out (QR code, horaire défini)
- Paie → Saisie des heures + primes → calcul du net → Paiement
- Congés → Demande → Approbation → Solde mis à jour
- Performance → Évaluation périodique avec scoring
- Planning → Créneaux horaires par employé

**Règles métier :**
- RB-01 : Un employé peut avoir un code PIN pour le pointage sans téléphone
- RB-02 : Les heures supplémentaires sont calculées au-delà de 40h/semaine
- RB-03 : Le solde de congés est calculé selon la politique du business
- RB-04 : La paie peut être en espèces ou via Mobile Money

**Pages :** `dashboard/employees/`, `attendances/`, `payroll/`, `leaves/`, `performance/`, `roles/`

**AC :** Création employé → pointage → calcul paie → paiement