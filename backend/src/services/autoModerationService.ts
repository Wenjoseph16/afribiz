import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

const BLOCKED_PATTERNS = [
  /(scam|arnaque|fraude)/i,
  /(spam|pub indésirable)/i,
  /(viagra|cash|gratuit)/i,
  /https?:\/\/[^\s]*(bit\.ly|tinyurl|shorturl)/i,
  /(buy followers|acheter followers)/i,
  /\b\d{10,}\b/,
];

const FLAG_PATTERNS = [
  /(insulte|insulte|haine)/i,
  /(discrimination|raciste|xénophobe)/i,
  /(violence|agression|menace)/i,
  /(harcèlement|harceler)/i,
];

export type ModerationResult = {
  action: 'ALLOW' | 'FLAG' | 'BLOCK';
  reason?: string;
};

export function checkContent(content: string): ModerationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return { action: 'BLOCK', reason: `Contenu interdit détecté` };
    }
  }
  for (const pattern of FLAG_PATTERNS) {
    if (pattern.test(content)) {
      return { action: 'FLAG', reason: `Contenu sensible détecté` };
    }
  }
  return { action: 'ALLOW' };
}

export async function autoFlag(
  content: string,
  type: string,
  referenceId: string,
  reporterId?: string
) {
  const result = checkContent(content);
  if (result.action === 'ALLOW') return null;
  const report = await prisma.contentReport.create({
    data: {
      reporterId: reporterId || '00000000-0000-0000-0000-000000000000',
      type: type as any,
      referenceId,
      reason: result.reason || 'Signalement automatique',
      description: `Auto-modération: ${result.action}`,
      status: result.action === 'BLOCK' ? 'ACTION_TAKEN' : 'PENDING',
    },
  });
  logger.info(`Auto-moderation: ${result.action} on ${type}/${referenceId} — ${result.reason}`);
  return report;
}

export async function checkAndFlagUserContent(
  userId: string,
  content: string,
  contentType: string,
  referenceId: string
) {
  const result = checkContent(content);
  if (result.action === 'BLOCK') {
    await prisma.userWarning.create({
      data: {
        userId,
        issuedById: '00000000-0000-0000-0000-000000000000',
        reason: result.reason || 'Contenu interdit',
        description: `Auto-modération: contenu bloqué dans ${contentType} (${referenceId})`,
      },
    });
  }
  return autoFlag(content, contentType, referenceId);
}
