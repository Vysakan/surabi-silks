import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROVIDER } from '@/services/_provider';
import * as cartService from '@/services/cartService';

const isApi = PROVIDER === 'api';

function applyServerCart(set, cart) {
  set({
    items: cart.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantLabel: i.variant
        ? `${i.variant.color.name}${i.variant.size ? ' / ' + i.variant.size : ''}`
        : '',
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      sellingUnit: i.sellingUnit,
    })),
  });
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      syncFromServer: async () => {
        if (!isApi) return;
        try {
          const cart = await cartService.get();
          applyServerCart(set, cart);
        } catch { /* keep local state */ }
      },

      addItem: async (item) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: item.quantity || 1 }] });
        }
        if (isApi) {
          try {
            const cart = await cartService.addItem(item.productId, item.variantId, item.quantity || 1);
            applyServerCart(set, cart);
          } catch { /* keep local state */ }
        }
      },

      removeItem: async (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
        if (isApi) {
          try {
            const cart = await cartService.removeItem(variantId);
            applyServerCart(set, cart);
          } catch { /* keep local state */ }
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
        if (isApi) {
          try {
            const cart = await cartService.updateQuantity(variantId, quantity);
            applyServerCart(set, cart);
          } catch { /* keep local state */ }
        }
      },

      clearCart: async () => {
        set({ items: [] });
        if (isApi) {
          try { await cartService.clear(); } catch { /* ignore */ }
        }
      },

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: 'surabi-cart' }
  )
);
