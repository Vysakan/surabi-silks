import { Link } from 'react-router';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { formatPrice } from '@/lib/formatters';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import EmptyState from '@/components/ui/EmptyState';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { FALLBACK_IMAGE } from '@/lib/constants';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          actionLabel="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />

      <ScrollReveal as="h1" className="text-2xl md:text-3xl font-semibold text-neutral-900 mt-4 mb-8">Shopping Cart</ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-neutral-100 rounded-xl">
              <Link to={`/product/${item.productId}`} className="w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                <SmartImage src={item.image || FALLBACK_IMAGE} alt={item.productName} containerClassName="w-full h-full" className="w-full h-full" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-medium text-neutral-800 truncate">{item.productName}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.variantLabel}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-neutral-400 hover:text-red-500 transition-colors shrink-0 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-neutral-900 mt-2">{formatPrice(item.unitPrice)}</p>
                {item.sellingUnit === 'metre' && (
                  <p className="text-xs text-neutral-500">per metre</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-neutral-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="text-sm font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-neutral-400 hover:text-red-500 transition-colors">
            Clear Cart
          </button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="border border-neutral-100 rounded-xl p-6 sticky top-28">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal ({items.length} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-primary-600">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-neutral-100 pt-3 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link to="/checkout" className="block mt-6">
              <Button className="w-full" size="lg">
                Proceed to Checkout <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link to="/shop" className="block text-center text-sm text-primary-600 mt-3 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
