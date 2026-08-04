import { DomainEventType } from '../events';
import { def } from './helpers';

export const publishUserSignedUp = def<{ userId: string; email: string; name: string }>(
  DomainEventType.USER_SIGNED_UP,
  (p) => ({ email: p.email, name: p.name }),
  (p) => ({ email: p.email })
);
export const publishUserLoggedIn = def<{ userId: string; device?: string; location?: string }>(
  DomainEventType.USER_LOGGED_IN,
  (p) => ({ device: p.device || '', location: p.location || '' }),
  (p) => ({ device: p.device, location: p.location })
);
export const publishUserLoggedOut = def<{ userId: string }>(
  DomainEventType.USER_LOGGED_OUT,
  () => ({})
);
export const publishPasswordChanged = def<{ userId: string }>(
  DomainEventType.PASSWORD_CHANGED,
  () => ({})
);
export const publishBusinessActivated = def<{
  userId: string;
  businessId: string;
  businessName: string;
}>(
  DomainEventType.BUSINESS_ACTIVATED,
  (p) => ({ businessId: p.businessId, businessName: p.businessName }),
  (p) => ({ businessId: p.businessId, businessName: p.businessName, link: '/dashboard' })
);
export const publishDeveloperActivated = def<{ userId: string }>(
  DomainEventType.DEVELOPER_ACTIVATED,
  () => ({})
);
export const publishSecurityAlert = def<{ userId: string; location: string; device: string }>(
  DomainEventType.SECURITY_ALERT,
  (p) => ({ location: p.location, device: p.device }),
  (p) => ({ device: p.device, location: p.location, link: '/dashboard/security' })
);
export const publishNewDeviceDetected = def<{ userId: string; device: string; location: string }>(
  DomainEventType.NEW_DEVICE_DETECTED,
  (p) => ({ device: p.device, location: p.location }),
  (p) => ({ device: p.device, location: p.location, link: '/dashboard/security' })
);
export const publishFraudAlert = def<{
  userId: string;
  reason: string;
  severity: string;
  metadata?: Record<string, unknown>;
}>(
  DomainEventType.FRAUD_ALERT,
  (p) => ({ reason: p.reason, severity: p.severity }),
  (p) => ({ reason: p.reason, link: '/dashboard/security', ...p.metadata })
);
export const publishSuspiciousActivity = def<{ userId: string; reason: string; location?: string }>(
  DomainEventType.SUSPICIOUS_ACTIVITY,
  (p) => ({ reason: p.reason, location: p.location || '' }),
  (p) => ({ reason: p.reason, location: p.location, link: '/dashboard/security' })
);
export const publishAccountLocked = def<{ userId: string; reason: string }>(
  DomainEventType.ACCOUNT_LOCKED,
  (p) => ({ reason: p.reason }),
  (p) => ({ reason: p.reason, link: '/dashboard/security' })
);
export const publishSetupIncomplete = def<{
  userId: string;
  businessId: string;
  missingSteps: string[];
}>(
  DomainEventType.SETUP_INCOMPLETE,
  (p) => ({ missingSteps: p.missingSteps }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/onboarding' })
);
export const publishOnboardingCompleted = def<{
  userId: string;
  businessId: string;
  businessName: string;
}>(
  DomainEventType.ONBOARDING_COMPLETED,
  (p) => ({ businessId: p.businessId, businessName: p.businessName }),
  (p) => ({ businessId: p.businessId, businessName: p.businessName, link: '/dashboard' })
);
