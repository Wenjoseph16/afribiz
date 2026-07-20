export function calcDiscountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function calcTaxAmount(amount: number, taxRate: number): number {
  return Math.round(amount * (taxRate / 100));
}

export function calcTotalWithTax(amount: number, taxRate: number): number {
  return amount + calcTaxAmount(amount, taxRate);
}

export function calcCartTotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function calcDeliveryFee(distanceKm: number, baseRate: number, perKmRate: number): number {
  return Math.round(baseRate + distanceKm * perKmRate);
}

export function calcRatingDistribution(reviews: { rating: number }[]): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++;
  }
  return dist;
}
