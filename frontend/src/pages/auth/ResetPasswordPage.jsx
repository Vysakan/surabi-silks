import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { getErrorMessage, getFieldErrors } from '@/lib/apiError';
import { passwordProblem, PASSWORD_HINT } from '@/lib/validators';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const STORAGE_KEY = 'ss-reset-token';

/** Reads the token once and removes it from the address bar (it stays in this tab so a refresh still works). */
function takeToken(searchParams) {
  const fromUrl = searchParams.get('token');
  if (fromUrl) {
    sessionStorage.setItem(STORAGE_KEY, fromUrl);
    window.history.replaceState(window.history.state, '', window.location.pathname);
    return fromUrl;
  }
  return sessionStorage.getItem(STORAGE_KEY) || '';
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const logoutLocally = useAuthStore((s) => s.logout);
  const [token] = useState(() => takeToken(searchParams));
  const [status, setStatus] = useState(token ? 'checking' : 'invalid'); // checking | ready | invalid | done
  const [info, setInfo] = useState(null);
  const [invalidReason, setInvalidReason] = useState('This link is invalid or has expired. Please request a new one.');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [doneMessage, setDoneMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authService.verifyResetToken(token)
      .then((result) => {
        if (cancelled) return;
        setInfo(result);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setInvalidReason(getErrorMessage(err, 'This link is invalid or has expired. Please request a new one.'));
        setStatus('invalid');
      });
    return () => { cancelled = true; };
  }, [token]);

  const isInvite = info?.purpose === 'invite';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const problem = passwordProblem(password);
    const next = {};
    if (problem) next.password = problem;
    if (password !== confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const result = await authService.resetPassword(token, password);
      sessionStorage.removeItem(STORAGE_KEY);
      logoutLocally(); // every session of this account was ended on the server
      setDoneMessage(result?.message || 'Your password has been changed.');
      setStatus('done');
    } catch (err) {
      if (err.response?.data?.error?.code === 'INVALID_TOKEN') {
        sessionStorage.removeItem(STORAGE_KEY);
        setInvalidReason(getErrorMessage(err));
        setStatus('invalid');
      } else {
        setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
        setFormError(getErrorMessage(err, 'Could not change the password. Please try again.'));
      }
    }
    setSaving(false);
  };

  if (status === 'checking') return <PageLoader />;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {isInvite ? 'Set your password' : 'Choose a new password'}
          </h1>
          {status === 'ready' && info?.email && (
            <p className="text-neutral-500 mt-1">For the account {info.email}</p>
          )}
        </div>

        {status === 'invalid' && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg" role="alert">{invalidReason}</div>
            <Link to="/forgot-password">
              <Button className="w-full" size="lg">Request a new link</Button>
            </Link>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 text-green-800 text-sm rounded-lg" role="status">{doneMessage}</div>
            <Link to="/login">
              <Button className="w-full" size="lg">Sign in</Button>
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg" role="alert">{formError}</div>}
            <PasswordInput
              label="New password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              hint={PASSWORD_HINT}
            />
            <PasswordInput
              label="Confirm new password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
            <Button type="submit" isLoading={saving} className="w-full" size="lg">
              {isInvite ? 'Set password' : 'Change password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
