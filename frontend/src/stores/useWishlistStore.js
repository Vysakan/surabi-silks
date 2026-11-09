import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROVIDER } from '@/services/_provider';
import * as wishlistService from '@/services/wishlistService';

const isApi = PROVIDER === 'api';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      _synced: false,

      syncFromServer: async () => {
        if (!isApi) return;
        try {
          const serverItems = await wishlistService.getAll();
          set({ items: serverItems, _synced: true });
        } catch {
          // offline or not logged in — keep local state
        }
      },

      addItem: async (item) => {
        if (get().items.some((i) => i.variantId === item.variantId)) return;
        set({ items: [...get().items, item] });
        if (isApi) {
          try {
            const serverItems = await wishlistService.add(item.productId, item.variantId);
            set({ items: serverItems });
          } catch { /* keep local state */ }
        }
      },

      removeItem: async (variantId) => {
        const item = get().items.find((i) => i.variantId === variantId);
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
        if (isApi && item) {
          try {
            await wishlistService.remove(item.productId);
          } catch { /* keep local state */ }
        }
      },

      toggleItem: async (item) => {
        const exists = get().items.some((i) => i.variantId === item.variantId);
        if (exists) {
          get().removeItem(item.variantId);
        } else {
          get().addItem(item);
        }
      },

      isInWishlist: (variantId) => get().items.some((i) => i.variantId === variantId),

      clearAll: () => set({ items: [] }),
    }),
    { name: 'surabi-wishlist' }
  )
);
