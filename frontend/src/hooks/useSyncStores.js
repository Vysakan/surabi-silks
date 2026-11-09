import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';

export function useSyncStores() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const syncWishlist = useWishlistStore((s) => s.syncFromServer);
  const syncCart = useCartStore((s) => s.syncFromServer);
  const didSync = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !didSync.current) {
      didSync.current = true;
      syncWishlist();
      syncCart();
    }
    if (!isAuthenticated) {
      didSync.current = false;
    }
  }, [isAuthenticated, syncWishlist, syncCart]);
}
