import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROVIDER } from '@/services/_provider';
import * as authService from '@/services/authService';
import { setUnauthorizedHandler } from '@/services/api/client';

const isApi = PROVIDER === 'api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      // The saved login is only a hint: with the API it is confirmed once per page load (verifySession).
      sessionChecked: !isApi,

      login: (userData) => set({ user: userData, isAuthenticated: true, sessionChecked: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setUser: (userData) => set({ user: userData }),

      /** Asks the API who is signed in, so a stale or changed role in this browser is corrected. */
      verifySession: async () => {
        if (!isApi || !get().isAuthenticated) {
          set({ sessionChecked: true });
          return;
        }
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, sessionChecked: true });
        } catch (error) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            set({ user: null, isAuthenticated: false, sessionChecked: true });
          } else {
            set({ sessionChecked: true }); // offline or server error: keep the saved state, the API still checks every request
          }
        }
      },
    }),
    {
      name: 'surabi-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Any request answered with 401 means the session is gone (expired, password changed, account disabled).
setUnauthorizedHandler(() => {
  if (useAuthStore.getState().isAuthenticated) {
    useAuthStore.getState().logout();
  }
});
