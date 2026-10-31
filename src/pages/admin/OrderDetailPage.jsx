import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, MapPin, Clock } from 'lucide-react';
import * as orderService from '@/services/orderService';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice, formatDateTime } from '@/lib/formatters';
import { getValidNextStatuses, FALLBACK_IMAGE } from '@/lib/constants';

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'primary',
  out_for_delivery: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    async function load() {
      const o = await orderService.getById(id);
      setOrder(o);
      if (o) setNewStatus(o.status);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.status) return;
    setUpdating(true);
    try {
      const updated = await orderService.updateStatus(id, newStatus);
      if (updated) {
        setOrder(updated);
        setNewStatus('');
      }
    } catch {
      // transition rejected by service
    }
    setUpdating(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="p-8 text-center text-neutral-500">Order not found</div>;

  const addr = order.shippingAddress;

  return (
    <div>
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{order.id}</h1>
          <p className="text-sm text-neutral-500 mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge color={STATUS_COLORS[order.status] || 'info'} className="text-sm px-3 py-1">{STATUS_LABELS[order.status] || order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-xl p-5">
          <h2 className="font-semibold mb-4">Items ({order.items.length})</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                  <img src={item.image} alt={item.productName} loading="lazy" onError={(e) => { e.target.src = FALLBACK_IMAGE; }} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-neutral-400">{item.variantLabel}</p>
                  <p className="text-sm mt-1">
                    {formatPrice(item.unitPrice)} × {item.quantity} = <span className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
            <div className="flex justify-between font-semibold text-base border-t border-neutral-100 pt-2 mt-2">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Update status */}
          <div className="bg-white border border-neutral-100 rounded-xl p-5">
            <h3 className="font-semibold mb-3">Update Status</h3>
            {(() => {
              const validNext = getValidNextStatuses(order.status);
              if (validNext.length === 0) {
                return <p className="text-sm text-neutral-500">No further transitions available.</p>;
              }
              const options = [
                { value: '', label: 'Select next status' },
                ...validNext.map((s) => ({ value: s, label: STATUS_LABELS[s] || s })),
              ];
              return (
                <>
                  <Select options={options} value={newStatus} onChange={(e) => setNewStatus(e.target.value)} />
                  <Button
                    onClick={handleStatusUpdate}
                    isLoading={updating}
                    disabled={!newStatus}
                    className="w-full mt-3"
                  >
                    Update Status
                  </Button>
                </>
              );
            })()}
          </div>

          {/* Shipping address */}
          {addr && (
            <div className="bg-white border border-neutral-100 rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin size={16} /> Shipping Address</h3>
              <div className="text-sm text-neutral-600 space-y-0.5">
                <p className="font-medium">{addr.fullName}</p>
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{addr.city}, {addr.state} {addr.pincode}</p>
                {addr.phone && <p>{addr.phone}</p>}
              </div>
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white border border-neutral-100 rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock size={16} /> Status Timeline</h3>
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
