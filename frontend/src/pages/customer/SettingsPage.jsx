import { useLogout } from '@/hooks/useLogout';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/ui/ScrollReveal';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

export default function SettingsPage() {
  const logout = useLogout();

  return (
    <div>
      <ScrollReveal as="h1" className="text-2xl font-semibold text-neutral-900 mb-6">Account Settings</ScrollReveal>

      <div className="max-w-md space-y-8">
        {/* Change password */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <ChangePasswordForm />
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              ['Order updates', true],
              ['Promotional emails', false],
              ['New arrivals', true],
            ].map(([label, defaultVal]) => (
              <label key={label} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{label}</span>
                <input type="checkbox" defaultChecked={defaultVal} className="accent-primary-500" />
              </label>
            ))}
          </div>
        </section>

        {/* Logout / Delete */}
        <section className="border-t border-neutral-100 pt-6">
          <Button variant="outline" onClick={() => logout('/')} className="w-full">
            Sign Out
          </Button>
        </section>
      </div>
    </div>
  );
}
