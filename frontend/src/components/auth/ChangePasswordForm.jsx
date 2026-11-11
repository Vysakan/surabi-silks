import { useState } from 'react';
import { Link } from 'react-router';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { getErrorMessage, getFieldErrors } from '@/lib/apiError';
import { passwordProblem, PASSWORD_HINT } from '@/lib/validators';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';

const EMPTY = { current: '', new: '', confirm: '' };

/** Change password while signed in (customers and admins). Other devices are signed out. */
export default function ChangePasswordForm() {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [passwords, setPasswords] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!passwords.current) next.current = 'Enter your current password';
    const problem = passwordProblem(passwords.new, user?.email);
    if (problem) next.new = problem;
    else if (passwords.new === passwords.current) next.new = 'The new password must be different from the current one';
    if (passwords.new !== passwords.confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const result = await authService.changePassword(passwords.current, passwords.new);
      addToast({ type: 'success', message: result?.message || 'Password updated' });
      setPasswords(EMPTY);
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors({ current: fields.currentPassword, new: fields.newPassword });
      addToast({ type: 'error', message: getErrorMessage(err, 'Could not change the password. Please try again.') });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <PasswordInput
        label="Current Password"
        name="current-password"
        autoComplete="current-password"
        value={passwords.current}
        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
        error={errors.current}
      />
      <PasswordInput
        label="New Password"
        name="new-password"
        autoComplete="new-password"
        value={passwords.new}
        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
        error={errors.new}
        hint={PASSWORD_HINT}
      />
      <PasswordInput
        label="Confirm New Password"
        name="confirm-password"
        autoComplete="new-password"
        value={passwords.confirm}
        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
        error={errors.confirm}
      />
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" isLoading={saving}>Update Password</Button>
        <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot it?</Link>
      </div>
      <p className="text-xs text-neutral-500">Changing your password signs you out on your other devices.</p>
    </form>
  );
}
