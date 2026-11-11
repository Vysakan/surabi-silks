import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Warehouse, Store, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import * as authService from '@/services/authService';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const items = user?.role === 'root_admin' ? [...navItems, { to: '/admin/admins', icon: Shield, label: 'Admin Management' }] : navItems;

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* Clear local state even if the API is unreachable. */ }
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-64 bg-neutral-900 text-white p-4 shrink-0 hidden lg:block">
        <h2 className="text-lg font-semibold mb-8 px-3">Surabi Admin</h2>
        <nav className="space-y-1">
          {items.map(({ to, icon: Icon, label, end }) => {
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>
        <nav className="lg:hidden flex gap-2 overflow-x-auto bg-white border-b border-neutral-200 px-4 py-2">
          {items.map(({ to, label, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to);
            return <Link key={to} to={to} className={cn('shrink-0 rounded-lg px-3 py-2 text-sm', active ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50')}>
              {label}
            </Link>;
          })}
        </nav>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
