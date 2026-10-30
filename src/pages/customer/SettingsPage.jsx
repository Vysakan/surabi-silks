import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (passwords.new.length < 6) {
      addToast({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    addToast({ type: 'success', message: 'Password changed (demo)' });
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleLogout = () => {
    logout();
    addToast({ type: 'success', message: 'Logged out' });
    navigate('/');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Account Settings</h1>

      <div className="max-w-md space-y-8">
        {/* Change password */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
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
