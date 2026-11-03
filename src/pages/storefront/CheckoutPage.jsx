import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ShoppingBag, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import * as orderService from '@/services/orderService';
import { formatPrice } from '@/lib/formatters';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants';
import { isValidEmail, isValidPhone, isValidPincode, isRequired } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { cn } from '@/lib/cn';
import { products } from '@/data/products';
import { FALLBACK_IMAGE } from '@/lib/constants';

function resolveImage(item) {
  const product = products.find((p) => p.id === item.productId);
  if (!product) return item.image || FALLBACK_IMAGE;
  const variant = product.variants.find((v) => v.id === item.variantId);
  return variant?.images?.[0] || product.variants[0]?.images?.[0] || item.image || FALLBACK_IMAGE;
}

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Pay using UPI apps' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when delivered' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const [step, setStep] = useState('form');
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [errors, setErrors] = useState({});
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    email: user?.email || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const validate = () => {
    const e = {};
    if (!isRequired(address.fullName)) e.fullName = 'Name is required';
    if (!isValidPhone(address.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!isValidEmail(address.email)) e.email = 'Enter a valid email address';
    if (!isRequired(address.line1)) e.line1 = 'Address is required';
    if (!isRequired(address.city)) e.city = 'City is required';
    if (!isRequired(address.state)) e.state = 'State is required';
    if (!isValidPincode(address.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    await orderService.create({
      customerId: user?.id || 'guest',
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantLabel: item.variantLabel,
        image: item.image,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      shippingAddress: address,
      paymentMethod,
      subtotal,
      shipping,
      total,
    });
    clearCart();
    setStep('success');
    setPlacing(false);
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add items to your cart before checking out"
          actionLabel="Shop Now"
          actionLink="/shop"
        />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={28} />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Order Placed!</h1>
        <p className="text-neutral-500 mb-8">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/shop"><Button variant="outline">Continue Shopping</Button></Link>
          {isAuthenticated && (
            <Link to="/account/orders"><Button>View Orders</Button></Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 mt-4 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} error={errors.fullName} />
              <Input label="Phone Number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} error={errors.phone} />
              <div className="sm:col-span-2">
                <Input label="Email" type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} error={errors.email} />
              </div>
              <div className="sm:col-span-2">
                <Input label="Address Line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} error={errors.line1} />
              </div>
              <div className="sm:col-span-2">
                <Input label="Address Line 2 (optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
              </div>
              <Input label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} error={errors.city} />
              <Input label="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} error={errors.state} />
              <Input label="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} error={errors.pincode} />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={cn(
                    'flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 p-3 sm:p-4 border rounded-xl transition-all text-center sm:text-left',
                    paymentMethod === m.id
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <m.icon size={20} className={cn('shrink-0', paymentMethod === m.id ? 'text-primary-600' : 'text-neutral-400')} />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">{m.label}</p>
                    <p className="text-[10px] sm:text-xs text-neutral-500 hidden sm:block">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <div>
          <div className="border border-neutral-100 rounded-xl p-6 sticky top-28">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3">
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                    <img src={resolveImage(item)} alt={item.productName} loading="lazy" onError={(e) => { e.target.src = FALLBACK_IMAGE; }} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-neutral-400">{item.variantLabel} × {item.quantity}</p>
                    <p className="text-sm font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              isLoading={placing}
              className="w-full mt-6"
              size="lg"
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
