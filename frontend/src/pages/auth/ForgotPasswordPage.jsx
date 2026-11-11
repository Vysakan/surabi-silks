import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Mail } from 'lucide-react';
import * as authService from '@/services/authService';
import { getErrorMessage } from '@/lib/apiError';
import { isValidEmail } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email.trim())) {
      setError('Enter the email address you registered with');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.forgotPassword(email.trim());
      setSentMessage(result?.message || 'If an account exists for that email, we have sent a reset link.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send the reset link. Please try again.'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
            <Mail size={22} />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Forgot your password?</h1>
          <p className="text-neutral-500 mt-1">Enter your email and we will send you a link to choose a new one.</p>
        </div>

        {sentMessage ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 text-green-800 text-sm rounded-lg" role="status">{sentMessage}</div>
            <p className="text-sm text-neutral-500">
              The link expires soon and works once. Did not get it? Check spam, or{' '}
              <button type="button" onClick={() => setSentMessage('')} className="text-primary-600 font-medium hover:underline">
                try again
              </button>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg" role="alert">{error}</div>}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" isLoading={loading} className="w-full" size="lg">
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-neutral-500 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
