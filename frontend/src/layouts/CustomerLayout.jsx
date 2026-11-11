import { Outlet, NavLink } from 'react-router';
import { User, MapPin, Package, Settings, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/account', icon: User, label: 'Profile', end: true },
  { to: '/account/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/account/orders', icon: Package, label: 'Orders' },
  { to: '/account/settings', icon: Settings, label: 'Settings' },
];

export default function CustomerLayout() {
  const logout = useLogout();
  const handleLogout = () => logout('/');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-56 shrink-0">
        <h2 className="text-lg font-semibold mb-4 px-4">My Account</h2>
        <nav className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <div className="border-t border-neutral-100 mt-3 pt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
