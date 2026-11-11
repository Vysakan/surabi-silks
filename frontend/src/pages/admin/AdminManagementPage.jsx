import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/useAuthStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const emptyForm = { name: '', email: '', phone: '', password: '' };

export default function AdminManagementPage() {
  const user = useAuthStore((s) => s.user);
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const { data } = await apiClient.get('/admin/admins'); setAdmins(data); }
    catch (e) { setError(e.response?.data?.error?.message || 'Unable to load admin accounts.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (user?.role === 'root_admin') load(); }, [user?.role]);
  if (user?.role !== 'root_admin') return <div className="p-6 rounded-xl bg-white">This section is available to Root Admins only.</div>;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (e) => {
    e.preventDefault(); setError(''); setMessage(''); setSaving(true);
    try {
      await apiClient.post('/admin/admins', { ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined });
      setForm(emptyForm); setMessage('Admin account created. Share its temporary password securely.'); await load();
    } catch (err) { setError(err.response?.data?.error?.message || 'Unable to create admin account.'); }
    finally { setSaving(false); }
  };
  return <div className="max-w-4xl space-y-8">
    <div><h1 className="text-2xl font-semibold text-neutral-900">Admin Management</h1><p className="text-sm text-neutral-500 mt-1">Create accounts for trusted staff. Admin access is assigned by the server.</p></div>
    <form onSubmit={submit} className="bg-white rounded-xl border border-neutral-100 p-5 space-y-4">
      <h2 className="font-semibold">Create Admin Account</h2>
      {error && <p className="text-sm text-error">{error}</p>}{message && <p className="text-sm text-green-700">{message}</p>}
      <div className="grid sm:grid-cols-2 gap-4"><Input label="Full Name" required minLength={2} maxLength={255} value={form.name} onChange={(e) => update('name', e.target.value)} />
        <Input label="Email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        <Input label="Phone Number" type="tel" minLength={10} maxLength={20} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        <Input label="Temporary Password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={form.password} onChange={(e) => update('password', e.target.value)} />
      </div>
      <p className="text-xs text-neutral-500">Share this password through a secure channel. The new admin can set a personal password using Forgot Password.</p>
      <Button type="submit" isLoading={saving}>Create Admin</Button>
    </form>
    <section className="bg-white rounded-xl border border-neutral-100 p-5"><h2 className="font-semibold mb-4">Admin Accounts</h2>
      {loading ? <p className="text-sm text-neutral-500">Loading…</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b text-neutral-500"><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Phone</th><th className="py-2">Role</th></tr></thead>
        <tbody>{admins.map((admin) => <tr key={admin.id} className="border-b last:border-0"><td className="py-3 pr-4">{admin.name}</td><td className="py-3 pr-4">{admin.email}</td><td className="py-3 pr-4">{admin.phone || '—'}</td><td className="py-3">{admin.role === 'root_admin' ? 'Root Admin' : 'Admin'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
