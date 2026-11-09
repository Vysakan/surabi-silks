import { Link } from 'react-router';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatPrice } from '@/lib/formatters';
import Button from '@/components/ui/Button';
import SmartImage from '@/components/ui/SmartImage';
import { FALLBACK_IMAGE } from '@/lib/constants';

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();

  if (!isCartDrawerOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-50 transition-opacity"
        onClick={closeCartDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag size={20} />
            Cart ({items.length})
          </h2>
          <button onClick={closeCartDrawer} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-neutral-200 mb-4" />
              <p className="text-neutral-500">Your cart is empty</p>
              <Button variant="outline" onClick={closeCartDrawer} className="mt-4">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                    <SmartImage src={item.image || FALLBACK_IMAGE} alt={item.productName} containerClassName="w-full h-full" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-800 truncate">{item.productName}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.variantLabel}</p>
                    <p className="text-sm font-semibold mt-1">{formatPrice(item.unitPrice)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-7 h-7 rounded border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="ml-auto text-xs text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-neutral-100 px-6 py-4 space-y-3">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            <p className="text-xs text-neutral-400">Shipping calculated at checkout</p>
            <div className="flex gap-3">
              <Link
                to="/cart"
                onClick={closeCartDrawer}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">View Cart</Button>
              </Link>
              <Link
                to="/checkout"
                onClick={closeCartDrawer}
                className="flex-1"
              >
                <Button className="w-full">Checkout</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
