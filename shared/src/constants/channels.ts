export const COMMUNICATION_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH'] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  EMAIL: 'E-mail',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  IN_APP: 'In-App',
  PUSH: 'Notification push',
};
