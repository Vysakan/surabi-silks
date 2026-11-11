import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router';
import { LogIn } from 'lucide-react';
import * as authService from '@/services/authService';
import { PROVIDER } from '@/services/_provider';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { getErrorMessage } from '@/lib/apiError';
import { isStaff } from '@/lib/roles';
import { isValidEmail } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';

// The demo shortcuts only exist with the built-in demo data, never with the real API.
const SHOW_DEMO_LOGIN = PROVIDER === 'dummy';

/** Where to go after signing in: back to the page that asked for a login, if this user may open it. */
function destinationFor(user, from) {
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
    const adminPage = from.startsWith('/admin');
    if (adminPage === isStaff(user)) return from;
  }
  return isStaff(user) ? '/admin' : '/';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, login } = useAuthStore();
  const syncWishlist = useWishlistStore((s) => s.syncFromServer);
  const syncCart = useCartStore((s) => s.syncFromServer);
  const addToast = useUIStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={destinationFor(user, location.state?.from)} replace />;
  }

  const signIn = async (signInEmail, signInPassword) => {
    setError('');
    setLoading(true);
    try {
      const signedIn = await authService.login(signInEmail.trim(), signInPassword);
      login(signedIn);
      syncWishlist();
      syncCart();
      addToast({ type: 'success', message: `Welcome back, ${signedIn.name}!` });
      navigate(destinationFor(signedIn, location.state?.from), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in. Please try again.'));
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }
    signIn(email, password);
  };

  const quickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    signIn(quickEmail, quickPassword);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Welcome Back</h1>
          <p className="text-neutral-500 mt-1">Sign in to your Surabi Silks account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg" role="alert">{error}</div>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            <LogIn size={18} className="mr-2" /> Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
        </p>

        {SHOW_DEMO_LOGIN && (
          <div className="mt-8 border-t border-neutral-100 pt-6">
            <p className="text-xs text-neutral-400 text-center mb-3 uppercase tracking-wider">Quick Login (Demo data only)</p>
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
        )}
      </div>
    </div>
  );
}
