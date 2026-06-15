import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export type VerificationMode = 'badge_only' | 'recommended' | 'required';

interface VerificationSettings {
  mode: VerificationMode;
  description: string;
}

const DEFAULT_VERIFICATION: VerificationSettings = {
  mode: 'badge_only',
  description: 'La vérification d\'identité est optionnelle. Les utilisateurs vérifiés obtiennent un badge de confiance.',
};

export async function getVerificationSettings(): Promise<VerificationSettings> {
  const setting = await prisma.platformSetting.findUnique({ where: { key: 'verification_mode' } });
  if (!setting) return DEFAULT_VERIFICATION;
  return { ...DEFAULT_VERIFICATION, ...(setting.value as any) };
}

export async function updateVerificationSettings(data: Partial<VerificationSettings>): Promise<VerificationSettings> {
  const current = await getVerificationSettings();
  const updated = { ...current, ...data };

  if (updated.mode && !['badge_only', 'recommended', 'required'].includes(updated.mode)) {
    throw new AppError('Mode de vérification invalide', 400);
  }

  await prisma.platformSetting.upsert({
    where: { key: 'verification_mode' },
    update: { value: updated },
    create: { key: 'verification_mode', value: updated, category: 'security', label: 'Mode de vérification', description: 'Configure le niveau de vérification requis pour les utilisateurs' },
  });

  return updated;
}
