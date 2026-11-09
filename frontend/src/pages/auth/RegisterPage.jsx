import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { UserPlus } from 'lucide-react';
import * as authService from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { isValidEmail, isValidPhone, isRequired, isMinLength } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const update = (field, value) => setForm({ ...form, [field]: value });

  const validate = () => {
    const e = {};
    if (!isRequired(form.name)) e.name = 'Name is required';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email';
    if (!isValidPhone(form.phone)) e.phone = 'Enter a valid 10-digit phone';
    if (!isMinLength(form.password, 6)) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const user = await authService.register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    if (user) {
      login(user);
      addToast({ type: 'success', message: 'Account created successfully!' });
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Create Account</h1>
          <p className="text-neutral-500 mt-1">Join Surabi Silks for an exclusive experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
          <Input label="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} />
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} error={errors.confirm} />
          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            <UserPlus size={18} className="mr-2" /> Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
