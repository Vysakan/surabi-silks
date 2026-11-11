import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import * as authService from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (password.length < 8 || password.length > 128) return setError('Password must be 8 to 128 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try { await authService.resetPassword(token, password); navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in again.' } }); }
    catch (err) { setError(err.response?.data?.error?.message || err.message || 'This reset link is invalid or expired.'); }
    finally { setLoading(false); }
  };
  return <div className="min-h-[70vh] flex items-center justify-center px-4 py-16"><div className="w-full max-w-md">
    <div className="text-center mb-8"><h1 className="text-2xl font-semibold text-neutral-900">Set a New Password</h1><p className="text-neutral-500 mt-2">Choose a password with at least 8 characters.</p></div>
    {!token ? <p className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">This reset link is invalid or incomplete.</p> : <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-error">{error}</p>}<Input label="New Password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input label="Confirm Password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <Button type="submit" isLoading={loading} className="w-full" size="lg">Update Password</Button>
    </form>}
    <p className="text-center text-sm text-neutral-500 mt-6"><Link to="/login" className="text-primary-600 hover:underline">Return to Sign In</Link></p>
  </div></div>;
}
