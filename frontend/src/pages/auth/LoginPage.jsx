import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router';
import { LogIn } from 'lucide-react';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuthStore();
  const syncWishlist = useWishlistStore((s) => s.syncFromServer);
  const syncCart = useCartStore((s) => s.syncFromServer);
  const addToast = useUIStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/account'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      if (user) {
        login(user);
        syncWishlist();
        syncCart();
        addToast({ type: 'success', message: `Welcome back, ${user.name}!` });
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        setError('Invalid email or password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const quickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
    setLoading(true);
    try {
      const user = await authService.login(quickEmail, quickPassword);
      login(user);
      syncWishlist();
      syncCart();
      addToast({ type: 'success', message: `Welcome, ${user.name}!` });
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch {
      setError('Quick login failed. Check dummy credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Welcome Back</h1>
          <p className="text-neutral-500 mt-1">Sign in to your Surabi Silks account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            <LogIn size={18} className="mr-2" /> Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
        </p>

        {/* Quick login for demo */}
        <div className="mt-8 border-t border-neutral-100 pt-6">
          <p className="text-xs text-neutral-400 text-center mb-3 uppercase tracking-wider">Quick Login (Demo)</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => quickLogin('priya@example.com', 'password123')}
              disabled={loading}
            >
              Customer
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => quickLogin('admin@surabsilks.com', 'admin123')}
              disabled={loading}
            >
              Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
