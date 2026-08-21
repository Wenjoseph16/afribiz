export const MESSAGE_PRODUCT_KEY = 'afribiz-pending-product';

export type PendingProduct = {
  id: string;
  name: string;
  price?: string | number;
  image?: string | null;
  slug?: string;
  businessId?: string;
};

export function setPendingProduct(product: PendingProduct) {
  try {
    localStorage.setItem(MESSAGE_PRODUCT_KEY, JSON.stringify(product));
  } catch {
    /* localStorage indisponible */
  }
}

export function clearPendingProduct() {
  try {
    localStorage.removeItem(MESSAGE_PRODUCT_KEY);
  } catch {
    /* localStorage indisponible */
  }
}
