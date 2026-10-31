import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Package, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import * as orderService from '@/services/orderService';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatPrice, formatDate } from '@/lib/formatters';

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  shipped: 'primary', out_for_delivery: 'primary', delivered: 'success', cancelled: 'error',
};

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function OrderHistoryPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await orderService.getByCustomerId(user.id);
      setOrders(data);
      setLoading(false);
    }
    load();
  }, [user.id]);

  if (loading) return <LoadingSpinner />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order, it will appear here"
        actionLabel="Start Shopping"
        actionLink="/shop"
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Order History</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/account/orders/${order.id}`}
            className="block border border-neutral-100 rounded-xl p-5 hover:border-neutral-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-semibold">{order.id}</span>
                <span className="text-sm text-neutral-400 ml-3">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge color={STATUS_COLORS[order.status] || 'info'}>{STATUS_LABELS[order.status] || order.status}</Badge>
                <ArrowRight size={16} className="text-neutral-300" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="w-10 h-12 rounded-lg overflow-hidden border-2 border-white bg-neutral-100">
                    <img src={item.image} alt="" loading="lazy" onError={(e) => { e.target.src = '/images/products/fabrics-stack.png'; }} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex-1 text-sm text-neutral-500">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
              <span className="font-semibold">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
