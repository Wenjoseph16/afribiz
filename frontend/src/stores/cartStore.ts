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
  addItem: (item: CartItem) => void;
  addMultipleItems: (items: CartItem[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
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
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalAmount: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'afribiz-cart',
    }
  )
);
