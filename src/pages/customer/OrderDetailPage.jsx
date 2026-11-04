import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Clock } from 'lucide-react';
import * as orderService from '@/services/orderService';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { formatPrice, formatDate, formatDateTime } from '@/lib/formatters';

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  shipped: 'primary', out_for_delivery: 'primary', delivered: 'success', cancelled: 'error',
};

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function OrderDetailPage() {
  const { orderId: id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const o = await orderService.getById(id);
      setOrder(o);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="text-center text-neutral-500 py-8">Order not found</div>;

  return (
    <div>
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <ScrollReveal as="h1" className="text-2xl font-semibold text-neutral-900">{order.id}</ScrollReveal>
          <p className="text-sm text-neutral-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge color={STATUS_COLORS[order.status] || 'info'}>{STATUS_LABELS[order.status] || order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4 border border-neutral-100 rounded-xl p-4">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                <SmartImage src={item.image} alt={item.productName} containerClassName="w-full h-full" className="w-full h-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-neutral-400">{item.variantLabel}</p>
                <p className="text-sm mt-1">
                  {formatPrice(item.unitPrice)} × {item.quantity} = <span className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
                </p>
              </div>
            </div>
          ))}

          <div className="border border-neutral-100 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
            <div className="flex justify-between font-semibold text-base border-t border-neutral-100 pt-2">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {order.shippingAddress && (
            <div className="border border-neutral-100 rounded-xl p-5">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <div className="text-sm text-neutral-600 space-y-0.5">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
              </div>
            </div>
          )}

          {order.statusHistory?.length > 0 && (
            <div className="border border-neutral-100 rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock size={16} /> Order Timeline</h3>
              <div className="space-y-3">
                {order.statusHistory.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-400" />
                      {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                      <p className="text-xs text-neutral-400">{formatDateTime(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
