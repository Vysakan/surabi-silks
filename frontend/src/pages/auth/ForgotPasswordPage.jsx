import { useState } from 'react';
import { Link } from 'react-router';
import * as authService from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await authService.forgotPassword(email); setSent(true); }
    catch (err) { setError(err.response?.data?.error?.message || err.message || 'Unable to send reset link.'); }
    finally { setLoading(false); }
  };
  return <div className="min-h-[70vh] flex items-center justify-center px-4 py-16"><div className="w-full max-w-md">
    <div className="text-center mb-8"><h1 className="text-2xl font-semibold text-neutral-900">Forgot Password</h1><p className="text-neutral-500 mt-2">Enter your account email and we’ll send a password reset link if it exists.</p></div>
    {sent ? <p className="p-4 rounded-lg bg-green-50 text-green-800 text-sm">If an account exists for that email, a reset link will be sent.</p> : <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-error">{error}</p>}<Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" isLoading={loading} className="w-full" size="lg">Send Reset Link</Button>
    </form>}
    <p className="text-center text-sm text-neutral-500 mt-6"><Link to="/login" className="text-primary-600 hover:underline">Return to Sign In</Link></p>
  </div></div>;
}
