import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (get().items.some((i) => i.variantId === item.variantId)) return;
        set({ items: [...get().items, item] });
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      toggleItem: (item) => {
        const exists = get().items.some((i) => i.variantId === item.variantId);
        if (exists) {
          set({ items: get().items.filter((i) => i.variantId !== item.variantId) });
        } else {
          set({ items: [...get().items, item] });
        }
      },

      isInWishlist: (variantId) => get().items.some((i) => i.variantId === variantId),

      clearAll: () => set({ items: [] }),
    }),
    { name: 'surabi-wishlist' }
  )
);
