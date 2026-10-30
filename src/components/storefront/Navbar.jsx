import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { categories } from '@/data/categories';
import { cn } from '@/lib/cn';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const totalItems = useCartStore((s) => s.getTotalItems());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { isAuthenticated, user } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, isSearchOpen, toggleSearch, openCartDrawer } = useUIStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      if (isSearchOpen) toggleSearch();
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white transition-shadow duration-200',
        scrolled && 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
      )}
    >
      {/* Top announcement bar */}
      <div className="bg-neutral-900 text-white text-xs text-center py-1.5 px-4">
        Free shipping on orders above ₹2,000 | Authentic Handloom Collection
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu toggle */}
          <button onClick={toggleMobileMenu} className="lg:hidden p-2 -ml-2 text-neutral-700">
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="text-xl font-semibold tracking-tight text-neutral-900">
            Surabi <span className="text-primary-500">Silks</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 ml-12">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveMenu(cat.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  to={`/shop/${cat.slug}`}
                  className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 py-5 transition-colors"
                >
                  {cat.name}
                  <ChevronDown size={14} className={cn('transition-transform', activeMenu === cat.id && 'rotate-180')} />
                </Link>

                {/* Mega menu dropdown */}
                {activeMenu === cat.id && cat.subcategories.length > 0 && (
                  <div className="absolute top-full left-0 bg-white border border-neutral-100 rounded-xl shadow-xl p-4 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-150">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/shop/${cat.slug}/${sub.slug}`}
                        className="block px-3 py-2 text-sm text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                    <div className="border-t border-neutral-100 mt-2 pt-2">
                      <Link
                        to={`/shop/${cat.slug}`}
                        className="block px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        View All {cat.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link to="/shop" className="text-sm text-neutral-600 hover:text-neutral-900 py-5 transition-colors">
              Shop All
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Desktop search */}
            <div className="hidden md:block mr-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-56 pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-full placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 focus:bg-white transition-all focus:w-64"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              </form>
            </div>

            {/* Mobile search toggle */}
            <button onClick={toggleSearch} className="md:hidden p-2 text-neutral-700">
              <Search size={20} />
            </button>

            <Link to="/wishlist" className="p-2 text-neutral-700 hover:text-primary-600 relative transition-colors">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-primary-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button onClick={openCartDrawer} className="p-2 text-neutral-700 hover:text-primary-600 relative transition-colors">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-primary-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <Link
              to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/account') : '/login'}
              className="p-2 text-neutral-700 hover:text-primary-600 transition-colors"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="md:hidden border-t border-neutral-100 px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-full placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
            />
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-100 bg-white max-h-[70vh] overflow-y-auto">
          <nav className="px-4 py-3 space-y-1">
            {categories.map((cat) => (
              <div key={cat.id}>
                <Link
                  to={`/shop/${cat.slug}`}
                  onClick={toggleMobileMenu}
                  className="block px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 rounded-lg"
                >
                  {cat.name}
                </Link>
                <div className="pl-6 space-y-0.5">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/shop/${cat.slug}/${sub.slug}`}
                      onClick={toggleMobileMenu}
                      className="block px-3 py-2 text-sm text-neutral-500 hover:text-primary-600 rounded-lg"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link
              to="/shop"
              onClick={toggleMobileMenu}
              className="block px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 rounded-lg"
            >
              Shop All
            </Link>
            <div className="border-t border-neutral-100 pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <Link to="/account" onClick={toggleMobileMenu} className="block px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg">My Account</Link>
                  <Link to="/account/orders" onClick={toggleMobileMenu} className="block px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg">My Orders</Link>
                </>
              ) : (
                <Link to="/login" onClick={toggleMobileMenu} className="block px-3 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg">Login / Register</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
