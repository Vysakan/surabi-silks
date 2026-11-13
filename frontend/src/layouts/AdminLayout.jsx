import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Warehouse, Store, LogOut, Users, Settings, Film } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLogout } from '@/hooks/useLogout';
import { isRootAdmin, ROLE_LABELS } from '@/lib/roles';
import ToastContainer from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { to: '/admin/reels', icon: Film, label: 'Reels' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/admin/users', icon: Users, label: 'Admin Users', rootOnly: true },
  { to: '/admin/account', icon: Settings, label: 'My Account' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const visibleItems = navItems.filter((item) => !item.rootOnly || isRootAdmin(user));

  const handleLogout = () => logout('/login');

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-64 bg-neutral-900 text-white p-4 shrink-0 hidden lg:block">
        <h2 className="text-lg font-semibold mb-8 px-3">Surabi Admin</h2>
        <nav className="space-y-1">
          {visibleItems.map(({ to, icon: Icon, label, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-8 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-white transition-colors"
          >
            <Store size={16} />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-medium text-neutral-800">Admin Panel</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline text-sm text-neutral-500">
                {user.name} <span className="text-neutral-400">({ROLE_LABELS[user.role] || user.role})</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        {/* Small screens: the sidebar is hidden, so the sections scroll sideways under the header */}
        <nav className="lg:hidden flex gap-1 overflow-x-auto bg-white border-b border-neutral-200 px-3 py-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {visibleItems.map(({ to, icon: Icon, label, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                  active ? 'bg-primary-50 text-primary-600 font-medium' : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
