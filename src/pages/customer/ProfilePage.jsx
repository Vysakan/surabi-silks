import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import * as customerService from '@/services/customerService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updated = await customerService.update(user.id, form);
    if (updated) {
      setUser({ ...user, ...form });
      addToast({ type: 'success', message: 'Profile updated' });
    }
    setSaving(false);
  };

  return (
    <div>
      <ScrollReveal as="h1" className="text-2xl font-semibold text-neutral-900 mb-6">My Profile</ScrollReveal>

      <form onSubmit={handleSave} className="max-w-md space-y-4">
        <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" isLoading={saving}>Save Changes</Button>
      </form>
    </div>
  );
}
