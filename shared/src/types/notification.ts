export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationCategory =
  | 'ACCOUNT'
  | 'SECURITY'
  | 'ORDER'
  | 'BOOKING'
  | 'PAYMENT'
  | 'PROMOTION'
  | 'REMINDER'
  | 'ALERT'
  | 'SYSTEM'
  | 'MESSAGE';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  category: NotificationCategory;
  priority: NotificationPriority;
  channel: NotificationChannel;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: NotificationChannel;
  enabled: boolean;
  categories: NotificationCategory[];
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  subject?: string;
  body: string;
  variables: string[];
  channels: NotificationChannel[];
  category: NotificationCategory;
}

export interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  data?: Record<string, unknown>;
}
