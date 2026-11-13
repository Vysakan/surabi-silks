import { useEffect } from 'react';
import { Link } from 'react-router';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatPrice } from '@/lib/formatters';
import SmartImage from '@/components/ui/SmartImage';
import { FALLBACK_IMAGE, FREE_SHIPPING_THRESHOLD } from '@/lib/constants';

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();

  useEffect(() => {
    if (!isCartDrawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeCartDrawer(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isCartDrawerOpen, closeCartDrawer]);

  if (!isCartDrawerOpen) return null;

  const subtotal = getSubtotal();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 sf-fade-in" onClick={closeCartDrawer} />

      <aside
        className="absolute right-0 top-0 h-full w-full sm:max-w-[420px] bg-white flex flex-col sf-slide-in-right"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200">
          <h2 className="text-base font-medium">
            Your cart{itemCount > 0 && <span className="text-neutral-500 font-normal"> ({itemCount})</span>}
          </h2>
          <button onClick={closeCartDrawer} aria-label="Close cart" className="p-2 -mr-2 hover:opacity-60 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-5 py-3 border-b border-neutral-200">
            <p className="text-xs text-neutral-600 mb-2">
              {remaining > 0
                ? <>Add <span className="font-medium text-black">{formatPrice(remaining)}</span> more for free shipping</>
                : 'Your order ships free'}
            </p>
            <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingBag size={40} strokeWidth={1.2} className="text-neutral-300" />
              <p className="text-neutral-600">Your cart is empty</p>
              <Link
                to="/shop"
                onClick={closeCartDrawer}
                className="inline-flex px-6 py-3 bg-black text-white text-sm font-medium rounded-[var(--radius-button)] hover:bg-neutral-800"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <div className="w-20 aspect-[3/4] bg-neutral-100 shrink-0 rounded-lg overflow-hidden">
                    <SmartImage src={item.image || FALLBACK_IMAGE} alt={item.productName} containerClassName="w-full h-full" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm text-black line-clamp-2">{item.productName}</h4>
                      <p className="text-sm shrink-0">{formatPrice(item.unitPrice * item.quantity)}</p>
                    </div>
                    {item.variantLabel && <p className="text-xs text-neutral-500 mt-1">{item.variantLabel}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-neutral-300 rounded-[var(--radius-button)]">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-xs text-neutral-500 underline underline-offset-4 hover:text-black cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-5 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="text-base font-medium">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-neutral-500">Shipping calculated at checkout.</p>
            <Link
              to="/checkout"
              onClick={closeCartDrawer}
              className="flex items-center justify-center w-full py-3.5 bg-black text-white text-sm font-medium rounded-[var(--radius-button)] hover:bg-neutral-800 transition-colors"
            >
              Check out
            </Link>
            <Link
              to="/cart"
              onClick={closeCartDrawer}
              className="block text-center text-sm underline underline-offset-4 hover:opacity-70"
            >
              View cart
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
