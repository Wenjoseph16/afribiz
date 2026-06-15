import { prisma } from '../lib/db';

export interface MonetizationSettings {
  transactionCommissionRate: number;
  escrowCommissionRate: number;
  developerModuleCommissionRate: number;
  minimumEscrowFee: number;
  maximumEscrowFee: number | null;
  currency: string;
}

const DEFAULTS: MonetizationSettings = {
  transactionCommissionRate: 0.01,
  escrowCommissionRate: 0.02,
  developerModuleCommissionRate: 0.20,
  minimumEscrowFee: 0,
  maximumEscrowFee: null,
  currency: 'FCFA',
};

export async function getMonetizationSettings(): Promise<MonetizationSettings> {
  try {
    // 1. Lire les PlatformSetting de la catégorie monetization (via le service dédié)
    const dbSettings = await prisma.platformSetting.findMany({
      where: { category: 'monetization' },
    });
    const map: Record<string, any> = {};
    for (const s of dbSettings) {
      map[s.key] = s.value;
    }

    // 2. Lire aussi les préfixes monetization_ stockés dans general (via le frontend admin/settings)
    const generalSettings = await prisma.platformSetting.findMany({
      where: { key: { startsWith: 'monetization_' } },
    });
    for (const s of generalSettings) {
      const key = s.key.replace('monetization_', '');
      // N'écraser que si pas déjà défini dans la catégorie monetization
      if (map[key] === undefined) {
        map[key] = s.value;
      }
    }

    // 3. CommissionConfig actives
    const configs = await prisma.commissionConfig.findMany({
      where: {
        key: { in: ['TRANSACTION_COMMISSION', 'ESCROW_COMMISSION', 'DEVELOPER_MODULE_COMMISSION'] },
        isActive: true,
      },
    });
    const configMap: Record<string, any> = {};
    for (const c of configs) {
      configMap[c.key] = {
        rate: c.rate / 100,
        minFee: c.minFee ? Number(c.minFee) : null,
        maxFee: c.maxFee ? Number(c.maxFee) : null,
      };
    }

    const settings: MonetizationSettings = {
      transactionCommissionRate: configMap['TRANSACTION_COMMISSION']?.rate ?? map['transactionCommissionRate'] ?? DEFAULTS.transactionCommissionRate,
      escrowCommissionRate: configMap['ESCROW_COMMISSION']?.rate ?? map['escrowCommissionRate'] ?? DEFAULTS.escrowCommissionRate,
      developerModuleCommissionRate: configMap['DEVELOPER_MODULE_COMMISSION']?.rate ?? map['developerModuleCommissionRate'] ?? DEFAULTS.developerModuleCommissionRate,
      minimumEscrowFee: Number(map['minimumEscrowFee'] ?? configMap['ESCROW_COMMISSION']?.minFee ?? DEFAULTS.minimumEscrowFee),
      maximumEscrowFee: map['maximumEscrowFee'] != null ? Number(map['maximumEscrowFee']) : (configMap['ESCROW_COMMISSION']?.maxFee ?? DEFAULTS.maximumEscrowFee),
      currency: map['currency'] ?? DEFAULTS.currency,
    };
    return settings;
  } catch {
    return DEFAULTS;
  }
}

export async function getTransactionCommissionRate(): Promise<number> {
  const settings = await getMonetizationSettings();
  return settings.transactionCommissionRate;
}

export async function getEscrowCommissionRate(): Promise<number> {
  const settings = await getMonetizationSettings();
  return settings.escrowCommissionRate;
}

export async function calculateCommission(amount: number, type: 'transaction' | 'escrow'): Promise<{
  rate: number;
  commission: number;
  netAmount: number;
}> {
  const settings = await getMonetizationSettings();
  const rate = type === 'escrow' ? settings.escrowCommissionRate : settings.transactionCommissionRate;
  let commission = Math.round(amount * rate * 100) / 100;
  if (type === 'escrow') {
    if (settings.minimumEscrowFee > 0 && commission < settings.minimumEscrowFee) {
      commission = settings.minimumEscrowFee;
    }
    if (settings.maximumEscrowFee != null && commission > settings.maximumEscrowFee) {
      commission = settings.maximumEscrowFee;
    }
  }
  return { rate, commission, netAmount: amount - commission };
}
