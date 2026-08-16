import { DomainEventType } from '../events';
import { def } from './helpers';

// ── Employees ──
export const publishEmployeeCreated = def<{
  userId: string;
  employeeId: string;
  businessId: string;
  employeeName: string;
}>(
  DomainEventType.EMPLOYEE_CREATED,
  (p) => ({ employeeId: p.employeeId, employeeName: p.employeeName }),
  (p) => ({ employeeId: p.employeeId, businessId: p.businessId, link: '/dashboard/employees' })
);
export const publishEmployeeAbsent = def<{
  userId: string;
  employeeId: string;
  businessId: string;
  employeeName: string;
}>(
  DomainEventType.EMPLOYEE_ABSENT,
  (p) => ({ employeeId: p.employeeId, employeeName: p.employeeName }),
  (p) => ({ employeeId: p.employeeId, businessId: p.businessId, link: '/dashboard/employees' })
);
export const publishEmployeeLate = def<{
  userId: string;
  employeeId: string;
  businessId: string;
  employeeName: string;
  lateMinutes: number;
}>(
  DomainEventType.EMPLOYEE_LATE,
  (p) => ({ employeeId: p.employeeId, employeeName: p.employeeName, lateMinutes: p.lateMinutes }),
  (p) => ({
    employeeId: p.employeeId,
    businessId: p.businessId,
    reason: `${p.lateMinutes} min de retard`,
    link: '/dashboard/employees',
  })
);
export const publishLeaveRequested = def<{
  userId: string;
  employeeId: string;
  businessId: string;
  employeeName: string;
}>(
  DomainEventType.LEAVE_REQUESTED,
  (p) => ({ employeeId: p.employeeId, employeeName: p.employeeName }),
  (p) => ({ employeeId: p.employeeId, businessId: p.businessId, link: '/dashboard/employees' })
);
export const publishLeaveApproved = def<{
  userId: string;
  employeeId: string;
  businessId: string;
  employeeName: string;
}>(
  DomainEventType.LEAVE_APPROVED,
  (p) => ({ employeeId: p.employeeId, employeeName: p.employeeName }),
  (p) => ({ employeeId: p.employeeId, businessId: p.businessId, link: '/dashboard/employees' })
);
export const publishPayrollProcessed = def<{ userId: string; businessId: string; amount: string }>(
  DomainEventType.PAYROLL_PROCESSED,
  (p) => ({ amount: p.amount }),
  (p) => ({ businessId: p.businessId, amount: p.amount, link: '/dashboard/employees' })
);
export const publishDocumentExpiring = def<{
  userId: string;
  documentId: string;
  employeeId: string;
  businessId: string;
  documentTitle: string;
  daysUntilExpiry: number;
}>(
  DomainEventType.DOCUMENT_EXPIRING,
  (p) => ({
    documentId: p.documentId,
    documentTitle: p.documentTitle,
    daysUntilExpiry: p.daysUntilExpiry,
  }),
  (p) => ({
    employeeId: p.employeeId,
    businessId: p.businessId,
    reason: `Expire dans ${p.daysUntilExpiry} jours`,
    link: '/dashboard/employees',
  })
);

// ── Delivery ──
export const publishDeliveryAssigned = def<{
  userId: string;
  deliveryId: string;
  businessId: string;
  driverName?: string;
}>(
  DomainEventType.DELIVERY_ASSIGNED,
  (p) => ({ deliveryId: p.deliveryId, driverName: p.driverName || '' }),
  (p) => ({
    deliveryId: p.deliveryId,
    businessId: p.businessId,
    link: `/dashboard/delivery/${p.deliveryId}`,
  })
);
export const publishDeliveryStarted = def<{
  userId: string;
  deliveryId: string;
  businessId: string;
}>(
  DomainEventType.DELIVERY_STARTED,
  (p) => ({ deliveryId: p.deliveryId }),
  (p) => ({
    deliveryId: p.deliveryId,
    businessId: p.businessId,
    link: `/dashboard/delivery/${p.deliveryId}`,
  })
);
export const publishDeliveryCompleted = def<{
  userId: string;
  deliveryId: string;
  businessId: string;
}>(
  DomainEventType.DELIVERY_COMPLETED,
  (p) => ({ deliveryId: p.deliveryId }),
  (p) => ({
    deliveryId: p.deliveryId,
    businessId: p.businessId,
    link: `/dashboard/delivery/${p.deliveryId}`,
  })
);
export const publishDeliveryFailed = def<{
  userId: string;
  deliveryId: string;
  businessId: string;
  reason: string;
}>(
  DomainEventType.DELIVERY_FAILED,
  (p) => ({ deliveryId: p.deliveryId, reason: p.reason }),
  (p) => ({
    deliveryId: p.deliveryId,
    businessId: p.businessId,
    reason: p.reason,
    link: `/dashboard/delivery/${p.deliveryId}`,
  })
);
export const publishDeliveryNoStart = def<{
  userId: string;
  deliveryId: string;
  businessId: string;
  minutesElapsed: number;
}>(
  DomainEventType.DELIVERY_NO_START,
  (p) => ({ deliveryId: p.deliveryId, minutesElapsed: p.minutesElapsed }),
  (p) => ({
    deliveryId: p.deliveryId,
    businessId: p.businessId,
    reason: `Pas démarrée après ${p.minutesElapsed} min`,
    link: `/dashboard/delivery/${p.deliveryId}`,
  })
);
export const publishDeliveryReassigned = def<{
  userId: string;
  deliveryId: string;
  businessId: string;
  newDriverName: string;
}>(
  DomainEventType.DELIVERY_REASSIGNED,
  (p) => ({ deliveryId: p.deliveryId, newDriverName: p.newDriverName }),
  (p) => ({
    deliveryId: p.deliveryId,
    businessId: p.businessId,
    businessName: p.newDriverName,
    link: `/dashboard/delivery/${p.deliveryId}`,
  })
);

// ── Rentals ──
export const publishRentalCreated = def<{
  userId: string;
  rentalId: string;
  businessName: string;
  businessId?: string;
}>(
  DomainEventType.RENTAL_CREATED,
  (p) => ({ rentalId: p.rentalId, businessName: p.businessName }),
  (p) => ({
    rentalId: p.rentalId,
    businessName: p.businessName,
    businessId: p.businessId,
    link: `/dashboard/rentals/${p.rentalId}`,
  })
);
export const publishRentalReturned = def<{
  userId: string;
  rentalId: string;
  businessName: string;
}>(
  DomainEventType.RENTAL_RETURNED,
  (p) => ({ rentalId: p.rentalId, businessName: p.businessName }),
  (p) => ({
    rentalId: p.rentalId,
    businessName: p.businessName,
    link: `/dashboard/rentals/${p.rentalId}`,
  })
);
export const publishRentalOverdue = def<{ userId: string; rentalId: string; businessName: string }>(
  DomainEventType.RENTAL_OVERDUE,
  (p) => ({ rentalId: p.rentalId, businessName: p.businessName }),
  (p) => ({
    rentalId: p.rentalId,
    businessName: p.businessName,
    link: `/dashboard/rentals/${p.rentalId}`,
  })
);
export const publishRentalReturnReminder = def<{
  userId: string;
  rentalId: string;
  businessName: string;
  daysUntilDue: number;
}>(
  DomainEventType.RENTAL_RETURN_REMINDER,
  (p) => ({ rentalId: p.rentalId, daysUntilDue: p.daysUntilDue }),
  (p) => ({
    rentalId: p.rentalId,
    businessName: p.businessName,
    reason: `Retour prévu dans ${p.daysUntilDue} jour(s)`,
    link: `/dashboard/rentals/${p.rentalId}`,
  })
);

// ── Developer ──
export const publishModuleSubmitted = def<{ userId: string; moduleId: string; moduleName: string }>(
  DomainEventType.MODULE_SUBMITTED,
  (p) => ({ moduleId: p.moduleId, moduleName: p.moduleName }),
  (p) => ({ moduleId: p.moduleId, link: '/developer/modules' })
);
export const publishModuleApproved = def<{ userId: string; moduleId: string; moduleName: string }>(
  DomainEventType.MODULE_APPROVED,
  (p) => ({ moduleId: p.moduleId, moduleName: p.moduleName }),
  (p) => ({ moduleId: p.moduleId, link: '/developer/modules' })
);
export const publishModuleRejected = def<{
  userId: string;
  moduleId: string;
  moduleName: string;
  reason: string;
}>(
  DomainEventType.MODULE_REJECTED,
  (p) => ({ moduleId: p.moduleId, moduleName: p.moduleName, reason: p.reason }),
  (p) => ({ moduleId: p.moduleId, reason: p.reason, link: '/developer/modules' })
);
export const publishModuleBugReported = def<{
  userId: string;
  moduleId: string;
  moduleName: string;
}>(
  DomainEventType.MODULE_BUG_REPORTED,
  (p) => ({ moduleId: p.moduleId, moduleName: p.moduleName }),
  (p) => ({ moduleId: p.moduleId, link: '/developer/modules' })
);
export const publishDeveloperRevenueEarned = def<{
  userId: string;
  amount: string;
  moduleName: string;
}>(
  DomainEventType.DEVELOPER_REVENUE_EARNED,
  (p) => ({ amount: p.amount, moduleName: p.moduleName }),
  (p) => ({ amount: p.amount, link: '/developer/revenue' })
);
export const publishDeveloperPayoutProcessed = def<{ userId: string; amount: string }>(
  DomainEventType.DEVELOPER_PAYOUT_PROCESSED,
  (p) => ({ amount: p.amount }),
  (p) => ({ amount: p.amount, link: '/developer/revenue' })
);

// ── Frais d'abonnement / Modules business ──
export const publishTrialExpiring = def<{
  userId: string;
  businessId: string;
  moduleId: string;
  moduleName: string;
  daysLeft: number;
}>(
  DomainEventType.TRIAL_EXPIRING,
  (p) => ({
    businessId: p.businessId,
    moduleId: p.moduleId,
    moduleName: p.moduleName,
    daysLeft: p.daysLeft,
  }),
  (p) => ({
    businessId: p.businessId,
    moduleId: p.moduleId,
    businessName: p.moduleName,
    reason: `Essai expire dans ${p.daysLeft} jours`,
    link: '/dashboard/business/modules',
  })
);
export const publishModuleInstalled = def<{
  userId: string;
  businessId: string;
  moduleId: string;
  moduleName: string;
}>(
  DomainEventType.MODULE_INSTALLED,
  (p) => ({ businessId: p.businessId, moduleId: p.moduleId, moduleName: p.moduleName }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/modules' })
);
export const publishModuleUninstalled = def<{
  userId: string;
  businessId: string;
  moduleId: string;
  moduleName: string;
}>(
  DomainEventType.MODULE_UNINSTALLED,
  (p) => ({ businessId: p.businessId, moduleId: p.moduleId, moduleName: p.moduleName }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/modules' })
);

// ── Scores & Badges ──
export const publishScoreRecalculated = def<{
  userId: string;
  businessId: string;
  score: number;
  previousScore?: number;
}>(
  DomainEventType.SCORE_RECALCULATED,
  (p) => ({ score: p.score, previousScore: p.previousScore || 0 }),
  (p) => ({
    businessId: p.businessId,
    score: p.score,
    previousScore: p.previousScore,
    link: '/dashboard/afriscore',
  })
);
export const publishBadgeEarned = def<{ userId: string; businessId: string; badgeType: string }>(
  DomainEventType.BADGE_EARNED,
  (p) => ({ badgeType: p.badgeType }),
  (p) => ({ badgeType: p.badgeType, businessId: p.businessId, link: '/dashboard/afriscore' })
);
export const publishScoreImproved = def<{
  userId: string;
  businessId: string;
  score: number;
  previousScore: number;
}>(
  DomainEventType.SCORE_IMPROVED,
  (p) => ({
    score: p.score,
    previousScore: p.previousScore,
    improvement: p.score - p.previousScore,
  }),
  (p) => ({
    businessId: p.businessId,
    score: p.score,
    previousScore: p.previousScore,
    link: '/dashboard/afriscore',
  })
);
export const publishScoreDecreased = def<{
  userId: string;
  businessId: string;
  score: number;
  previousScore: number;
}>(
  DomainEventType.SCORE_DECREASED,
  (p) => ({ score: p.score, previousScore: p.previousScore, drop: p.previousScore - p.score }),
  (p) => ({
    businessId: p.businessId,
    score: p.score,
    previousScore: p.previousScore,
    link: '/dashboard/afriscore',
  })
);
export const publishScoreCritical = def<{
  userId: string;
  businessId: string;
  score: number;
  previousScore?: number;
}>(
  DomainEventType.SCORE_CRITICAL,
  (p) => ({ score: p.score, previousScore: p.previousScore || 0 }),
  (p) => ({
    businessId: p.businessId,
    score: p.score,
    previousScore: p.previousScore,
    reason: `Score critique: ${p.score}`,
    link: '/dashboard/afriscore',
  })
);

// ── System & Backups ──
export const publishSystemError = def<{ userId: string; error: string; component: string }>(
  DomainEventType.SYSTEM_ERROR,
  (p) => ({ error: p.error, component: p.component }),
  (p) => ({ reason: p.error })
);
export const publishBackupFailed = def<{ userId: string; error: string }>(
  DomainEventType.BACKUP_FAILED,
  (p) => ({ error: p.error }),
  (p) => ({ reason: p.error })
);
export const publishDailyReportReady = def<{
  userId: string;
  reportDate: string;
  stats: Record<string, unknown>;
}>(
  DomainEventType.DAILY_REPORT_READY,
  (p) => ({ reportDate: p.reportDate, stats: p.stats }),
  (p) => ({ reason: `Rapport du ${p.reportDate}`, link: '/dashboard/admin' })
);

// ── Growth Engine ──
export const publishMorningBriefGenerated = def<{
  userId: string;
  businessId: string;
  metrics: string;
  adviceCount: number;
}>(
  DomainEventType.MORNING_BRIEF_GENERATED,
  (p) => ({ businessId: p.businessId, metrics: p.metrics, adviceCount: p.adviceCount }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/growth/brief' })
);
export const publishEveningSummaryGenerated = def<{
  userId: string;
  businessId: string;
  metrics: string;
  improvementsCount: number;
}>(
  DomainEventType.EVENING_SUMMARY_GENERATED,
  (p) => ({ businessId: p.businessId, metrics: p.metrics, improvementsCount: p.improvementsCount }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/growth/summary' })
);
export const publishUrgencyAlert = def<{
  userId: string;
  businessId: string;
  type: string;
  message: string;
}>(
  DomainEventType.URGENCY_ALERT_GENERATED,
  (p) => ({ businessId: p.businessId, type: p.type, message: p.message }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/attention' })
);
export const publishOpportunityDetected = def<{
  userId: string;
  businessId: string;
  keyword: string;
  count: number;
}>(
  DomainEventType.OPPORTUNITY_DETECTED,
  (p) => ({ businessId: p.businessId, keyword: p.keyword, count: p.count }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/opportunities' })
);

// ── Developer Weekly Report ──
export const publishWeeklyDevReport = def<{
  userId: string;
  weekStart: string;
  downloads: number;
  revenue: number;
  newReviews: number;
}>(
  DomainEventType.WEEKLY_DEV_REPORT,
  (p) => ({
    weekStart: p.weekStart,
    downloads: p.downloads,
    revenue: p.revenue,
    newReviews: p.newReviews,
  }),
  (p) => ({ amount: String(p.revenue), link: '/developer/revenue' })
);

// ── Savings / Tontine ──
export const publishSavingsCycleClosed = def<{
  userId: string;
  businessId: string;
  groupName: string;
  cycleNumber: number;
  totalCollected: number;
  groupId: string;
  cycleId: string;
}>(
  DomainEventType.SAVINGS_CYCLE_CLOSED,
  (p) => ({
    businessId: p.businessId,
    groupName: p.groupName,
    cycleNumber: p.cycleNumber,
    totalCollected: p.totalCollected,
    groupId: p.groupId,
    cycleId: p.cycleId,
  }),
  (p) => ({
    businessId: p.businessId,
    businessName: p.groupName,
    amount: String(p.totalCollected),
    link: `/dashboard/savings/${p.groupId}`,
  })
);
export const publishSavingsContributionReceived = def<{
  userId: string;
  businessId: string;
  memberName: string;
  amount: number;
  groupName: string;
  groupId: string;
}>(
  DomainEventType.SAVINGS_CONTRIBUTION_RECEIVED,
  (p) => ({
    businessId: p.businessId,
    memberName: p.memberName,
    amount: p.amount,
    groupName: p.groupName,
    groupId: p.groupId,
  }),
  (p) => ({
    businessId: p.businessId,
    businessName: p.groupName,
    amount: String(p.amount),
    link: `/dashboard/savings/${p.groupId}`,
  })
);
export const publishSavingsLoanApproved = def<{
  userId: string;
  businessId: string;
  memberName: string;
  amount: number;
  groupName: string;
  groupId: string;
}>(
  DomainEventType.SAVINGS_LOAN_APPROVED,
  (p) => ({
    businessId: p.businessId,
    memberName: p.memberName,
    amount: p.amount,
    groupName: p.groupName,
    groupId: p.groupId,
  }),
  (p) => ({
    businessId: p.businessId,
    businessName: p.groupName,
    amount: String(p.amount),
    link: `/dashboard/savings/${p.groupId}`,
  })
);

// ── Comments & Reports ──
export const publishCommentCreated = def<{
  userId: string;
  commentId: string;
  targetType: string;
  targetOwnerId?: string;
  content: string;
}>(
  DomainEventType.COMMENT_CREATED,
  (p) => ({ commentId: p.commentId, targetType: p.targetType, content: p.content }),
  (p) => ({
    link: `/${p.targetType.toLowerCase()}s/${p.commentId}`,
    recipientRole: p.targetOwnerId ? 'BUSINESS' : undefined,
    email: p.targetOwnerId,
  })
);
export const publishCommentDeleted = def<{ userId: string; commentId: string; targetType: string }>(
  DomainEventType.COMMENT_DELETED,
  (p) => ({ commentId: p.commentId, targetType: p.targetType })
);
export const publishReportCreated = def<{
  userId: string;
  reportId: string;
  targetType: string;
  reason: string;
}>(
  DomainEventType.REPORT_CREATED,
  (p) => ({ reportId: p.reportId, targetType: p.targetType, reason: p.reason }),
  (p) => ({ reason: p.reason, link: '/admin/reports' })
);
export const publishReportResolved = def<{ userId: string; reportId: string; status: string }>(
  DomainEventType.REPORT_RESOLVED,
  (p) => ({ reportId: p.reportId, status: p.status }),
  (_p) => ({ link: '/admin/reports' })
);

// ── Boss : alerte grosse remise (Chantier 5, Brique B) ──
// Seuil configurable par business (BusinessSettings.discountAlertThreshold).
// Dès qu'une vente dépasse le seuil, le boss reçoit une alerte TEMPS RÉEL
// (socket user:{id}) + une notification in-app signée (qui/quoi/prix/remise).
export const publishBossDiscountAlert = def<{
  userId: string; // le boss
  businessId: string;
  businessName: string;
  orderId: string;
  orderNumber: string;
  baseAmount: number;
  finalAmount: number;
  discountAmount: number;
  performedBy: string;
  performedByName: string;
  itemLabel: string;
}>(
  DomainEventType.URGENCY_ALERT_GENERATED,
  (p) => ({
    businessId: p.businessId,
    type: 'BOSS_DISCOUNT_ALERT',
    message: `${p.itemLabel} vendu ${p.baseAmount} F à ${p.finalAmount} F (remise ${p.discountAmount} F) par ${p.performedByName}`,
  }),
  (p) => ({
    businessId: p.businessId,
    link: `/dashboard/orders/${p.orderId}`,
  })
);
