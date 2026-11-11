import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

/** Signs out on the server (ends the session) and in this browser. */
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);

  return useCallback(async (redirectTo = '/') => {
    try {
      await authService.logout();
    } catch {
      // The session may already be gone; signing out locally is still right.
    }
    clearAuth();
    addToast({ type: 'success', message: 'You have been signed out' });
    navigate(redirectTo);
  }, [navigate, clearAuth, addToast]);
}
