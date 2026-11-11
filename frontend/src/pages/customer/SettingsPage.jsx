import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import * as authService from '@/services/authService';
import { useUIStore } from '@/stores/useUIStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (passwords.new.length < 8) {
      addToast({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }
    try {
      await authService.changePassword(passwords.current, passwords.new);
      logout();
      addToast({ type: 'success', message: 'Password changed. Please sign in again.' });
      navigate('/login');
    } catch (error) {
      addToast({ type: 'error', message: error.response?.data?.error?.message || error.message || 'Unable to change password.' });
    }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* Clear local state even if the API is unreachable. */ }
    logout();
    addToast({ type: 'success', message: 'Logged out' });
    navigate('/');
  };

  return (
    <div>
      <ScrollReveal as="h1" className="text-2xl font-semibold text-neutral-900 mb-6">Account Settings</ScrollReveal>

      <div className="max-w-md space-y-8">
        {/* Change password */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              autoComplete="current-password"
              required
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              required
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
            <Button type="submit">Update Password</Button>
          </form>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              ['Order updates', true],
              ['Promotional emails', false],
              ['New arrivals', true],
            ].map(([label, defaultVal]) => (
              <label key={label} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{label}</span>
                <input type="checkbox" defaultChecked={defaultVal} className="accent-primary-500" />
              </label>
            ))}
          </div>
        </section>

        {/* Logout / Delete */}
        <section className="border-t border-neutral-100 pt-6">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Sign Out
          </Button>
        </section>
      </div>
    </div>
  );
}
