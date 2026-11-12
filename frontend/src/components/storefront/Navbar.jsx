import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { useLogout } from '@/hooks/useLogout';
import { isStaff } from '@/lib/roles';
import { cn } from '@/lib/cn';
import SearchOverlay from '@/components/storefront/SearchOverlay';

// Main categories shown as columns in the "Shop" menu; the rest are on /categories.
const MEGA_MENU_LIMIT = 5;

const PAGE_LINKS = [
  { to: '/categories', label: 'Collections' },
  { to: '/about-us', label: 'About' },
  { to: '/contact-us', label: 'Contact' },
];

const navLinkClass = ({ isActive }) =>
  cn(
    'relative py-2 text-[0.9rem] text-neutral-700 hover:text-black transition-colors',
    'after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-black after:transition-all',
    isActive ? 'text-black after:w-full' : 'after:w-0 hover:after:w-full'
  );

function IconButton({ children, label, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn('relative p-2 text-neutral-900 hover:opacity-60 transition-opacity cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  );
}

function CountBubble({ count }) {
  if (!count) return null;
  return (
    <span className="absolute top-0.5 right-0 min-w-4 h-4 px-1 bg-black text-white text-[10px] leading-4 font-medium rounded-full text-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function MegaMenu({ categories, onNavigate }) {
  const shown = categories.slice(0, MEGA_MENU_LIMIT);
  return (
    <div className="absolute left-0 right-0 top-full bg-white border-t border-neutral-200 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.15)] sf-slide-down">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-8">
        {shown.map((cat) => (
          <div key={cat.id} className="min-w-0">
            <Link
              to={`/shop/${cat.slug}`}
              onClick={onNavigate}
              className="block text-sm font-semibold text-black mb-3 hover:underline underline-offset-4"
            >
              {cat.name}
            </Link>
            <ul className="space-y-2">
              {cat.subcategories.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/shop/${cat.slug}/${sub.slug}`}
                    onClick={onNavigate}
                    className="text-sm text-neutral-600 hover:text-black transition-colors"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="min-w-0 flex flex-col items-start gap-3">
          <Link to="/shop" onClick={onNavigate} className="sf-link">Shop all products</Link>
          <Link to="/shop?sort=newest" onClick={onNavigate} className="sf-link">New arrivals</Link>
          <Link to="/categories" onClick={onNavigate} className="sf-link">All collections</Link>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ categories, onClose }) {
  const [openId, setOpenId] = useState(null);
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();
  const row = 'flex items-center justify-between w-full py-3.5 text-base text-black border-b border-neutral-100';

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40 sf-fade-in" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white flex flex-col sf-slide-in-left">
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200">
          <span className="text-sm font-medium tracking-wide uppercase">Menu</span>
          <IconButton label="Close menu" onClick={onClose} className="-mr-2"><X size={22} /></IconButton>
        </div>

        <nav className="flex-1 overflow-y-auto px-5">
          <Link to="/" onClick={onClose} className={row}>Home</Link>
          <Link to="/shop" onClick={onClose} className={row}>Shop all</Link>
          {categories.map((cat) => {
            const hasSubs = cat.subcategories.length > 0;
            const open = openId === cat.id;
            return (
              <div key={cat.id} className="border-b border-neutral-100">
                <div className="flex items-center">
                  <Link to={`/shop/${cat.slug}`} onClick={onClose} className="flex-1 py-3.5 text-base text-black">
                    {cat.name}
                  </Link>
                  {hasSubs && (
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : cat.id)}
                      className="p-2 -mr-2 text-neutral-500"
                      aria-label={`${open ? 'Hide' : 'Show'} ${cat.name} collections`}
                      aria-expanded={open}
                    >
                      <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
                    </button>
                  )}
                </div>
                {hasSubs && open && (
                  <div className="pb-3 pl-3 space-y-0.5">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/shop/${cat.slug}/${sub.slug}`}
                        onClick={onClose}
                        className="block py-2 text-sm text-neutral-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {PAGE_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={onClose} className={row}>
              {l.label} <ChevronRight size={16} className="text-neutral-400" />
            </Link>
          ))}
          <Link to="/blog" onClick={onClose} className={row}>
            Blog <ChevronRight size={16} className="text-neutral-400" />
          </Link>
          <Link to="/wishlist" onClick={onClose} className={row}>
            Wishlist <Heart size={16} className="text-neutral-400" />
          </Link>
        </nav>

        <div className="px-5 py-4 border-t border-neutral-200 bg-[var(--color-surface)]">
          {isAuthenticated ? (
            <>
              {isStaff(user) ? (
                <Link to="/admin" onClick={onClose} className="block py-2 text-sm">Admin dashboard</Link>
              ) : (
                <>
                  <Link to="/account" onClick={onClose} className="block py-2 text-sm">My account</Link>
                  <Link to="/account/orders" onClick={onClose} className="block py-2 text-sm">My orders</Link>
                </>
              )}
              <button
                type="button"
                onClick={() => { onClose(); logout('/'); }}
                className="block py-2 text-sm text-neutral-500"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={onClose} className="flex items-center gap-2 py-2 text-sm">
              <User size={18} /> Log in / Create account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  const totalItems = useCartStore((s) => s.getTotalItems());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { isAuthenticated, user } = useAuthStore();
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);
  const openSearch = useUIStore((s) => s.openSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const { categories } = useCategoryTree();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus when the page changes.
  useEffect(() => {
    setMegaOpen(false);
    closeMobileMenu();
    closeSearch();
  }, [pathname, closeMobileMenu, closeSearch]);

  // No page scrolling behind the mobile menu.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isMobileMenuOpen]);

  const accountLink = isAuthenticated ? (isStaff(user) ? '/admin' : '/account') : '/login';

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[#121212] text-white text-[11px] sm:text-xs tracking-wide text-center py-2 px-4 truncate">
        Free shipping on orders above ₹2,000 &nbsp;·&nbsp; Authentic handloom collection
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 bg-white border-b transition-colors',
          scrolled ? 'border-neutral-200' : 'border-transparent'
        )}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 lg:h-[4.5rem]">
            {/* Left: mobile menu + search / desktop logo */}
            <div className="flex items-center">
              <IconButton label="Open menu" onClick={toggleMobileMenu} className="lg:hidden -ml-2">
                <Menu size={22} strokeWidth={1.6} />
              </IconButton>
              <IconButton label="Search" onClick={openSearch} className="lg:hidden">
                <Search size={20} strokeWidth={1.6} />
              </IconButton>
              <Link to="/" className="hidden lg:flex items-center" aria-label="Surabhi Silks home">
                <img src="/logo.jpg" alt="Surabhi Silks" className="h-11 w-auto" />
              </Link>
            </div>

            {/* Centre: mobile logo / desktop menu */}
            <div className="flex justify-center">
              <Link to="/" className="lg:hidden flex items-center" aria-label="Surabhi Silks home">
                <img src="/logo.jpg" alt="Surabhi Silks" className="h-10 w-auto" />
              </Link>
              <nav className="hidden lg:flex items-center gap-8">
                <NavLink to="/" end className={navLinkClass} onMouseEnter={() => setMegaOpen(false)}>Home</NavLink>
                <div onMouseEnter={() => setMegaOpen(true)} className="flex items-center">
                  <NavLink
                    to="/shop"
                    className={(state) => cn(navLinkClass(state), 'flex items-center gap-1')}
                    onFocus={() => setMegaOpen(true)}
                  >
                    Shop
                    <ChevronDown size={14} className={cn('transition-transform', megaOpen && 'rotate-180')} />
                  </NavLink>
                </div>
                {PAGE_LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} className={navLinkClass} onMouseEnter={() => setMegaOpen(false)}>
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right: icons */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <IconButton label="Search" onClick={openSearch} className="hidden lg:block">
                <Search size={20} strokeWidth={1.6} />
              </IconButton>
              <Link to={accountLink} aria-label="Account" className="p-2 text-neutral-900 hover:opacity-60 transition-opacity">
                <User size={20} strokeWidth={1.6} />
              </Link>
              <Link to="/wishlist" aria-label="Wishlist" className="relative p-2 text-neutral-900 hover:opacity-60 transition-opacity hidden sm:block">
                <Heart size={20} strokeWidth={1.6} />
                <CountBubble count={wishlistCount} />
              </Link>
              <IconButton label="Cart" onClick={openCartDrawer} className="-mr-2">
                <ShoppingBag size={20} strokeWidth={1.6} />
                <CountBubble count={totalItems} />
              </IconButton>
            </div>
          </div>
        </div>

        {megaOpen && categories.length > 0 && (
          <div className="hidden lg:block">
            <MegaMenu categories={categories} onNavigate={() => setMegaOpen(false)} />
          </div>
        )}
      </header>

      {isMobileMenuOpen && <MobileMenu categories={categories} onClose={closeMobileMenu} />}
      {isSearchOpen && <SearchOverlay onClose={closeSearch} />}
    </>
  );
}
