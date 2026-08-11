export function formatCurrency(amount: number | string | null | undefined): string {
  const CURRENCY_SYMBOL = 'FCFA';

  if (amount === null || amount === undefined) {
    return 'Gratuit';
  }

  const numValue = typeof amount === 'string' ? Number(amount) : amount;
  if (typeof numValue !== 'number' || Number.isNaN(numValue) || numValue <= 0) {
    return 'Gratuit';
  }

  return `${numValue.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}`;
}
