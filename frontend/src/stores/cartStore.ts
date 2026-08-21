import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  businessId: string;
  businessName?: string;
}

function compositeKey(item: { productId: string; businessId: string }): string {
  return `${item.productId}::${item.businessId}`;
}

interface CartStore {
  items: CartItem[];
  open: boolean;
  addItem: (item: CartItem) => void;
  addMultipleItems: (items: CartItem[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      addItem: (item) => {
        const currentItems = get().items;
        const key = compositeKey(item);
        const existingItem = currentItems.find((i) => compositeKey(i) === key);

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              compositeKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...currentItems, item] });
        }
      },
      addMultipleItems: (newItems) => {
        const currentItems = get().items;
        const remaining = [...currentItems];

        for (const item of newItems) {
          const key = compositeKey(item);
          const idx = remaining.findIndex((i) => compositeKey(i) === key);
          if (idx >= 0) {
            remaining[idx] = {
              ...remaining[idx],
              quantity: remaining[idx].quantity + item.quantity,
            };
          } else {
            remaining.push(item);
          }
        }

        set({ items: remaining });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        });
      },
      clearCart: () => set({ items: [] }),
      openDrawer: () => set({ open: true }),
      closeDrawer: () => set({ open: false }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalAmount: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'afribiz-cart',
      // IMPORTANT : le `version` est COUPLÉ AU SEED. Si le seed backend change les
      // IDs des produits (régénération), incrémenter ce numéro pour purger les
      // paniers locaux aux IDs obsolètes (le migrate filtre + purge en une passe).
      version: 2,
      partialize: (state) => ({ items: state.items }),
      // Purge les items fantômes (produits supprimés / IDs d'anciens seeds)
      // pour que le badge ne montre plus jamais un panier vide de contenu.
      migrate: (persisted: any) => {
        const items: CartItem[] = Array.isArray(persisted?.items)
          ? persisted.items.filter(
              (i: any) =>
                i &&
                typeof i.productId === 'string' &&
                i.productId.length > 0 &&
                typeof i.name === 'string' &&
                typeof i.price === 'number' &&
                Number.isFinite(i.price) &&
                i.price >= 0 &&
                typeof i.businessId === 'string'
            )
          : [];
        return { items, open: false };
      },
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== 'afribiz-cart') return;
    if (!e.newValue) {
      useCartStore.setState({ items: [] });
      return;
    }
    try {
      const parsed = JSON.parse(e.newValue);
      const items: CartItem[] = Array.isArray(parsed?.state?.items) ? parsed.state.items : [];
      useCartStore.setState({ items });
    } catch {
      // valeur de stockage invalide : on l'ignore
    }
  });
}
