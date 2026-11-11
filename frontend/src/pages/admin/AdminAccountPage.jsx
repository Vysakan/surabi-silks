import { useAuthStore } from '@/stores/useAuthStore';
import { ROLE_LABELS, isRootAdmin } from '@/lib/roles';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

/** /admin/account - the signed-in admin's own details and password. */
export default function AdminAccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">My Account</h1>

      <section className="bg-white border border-neutral-100 rounded-xl p-5 mb-6 text-sm space-y-1">
        <p className="font-medium text-neutral-800">{user?.name}</p>
        <p className="text-neutral-500">{user?.email}</p>
        <p className="text-neutral-500">Role: {ROLE_LABELS[user?.role] || user?.role}</p>
        {!isRootAdmin(user) && (
          <p className="text-xs text-neutral-400 pt-2">Only a root admin can change roles or add admins.</p>
        )}
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
