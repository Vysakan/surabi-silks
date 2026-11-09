import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { DollarSign, ShoppingCart, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import * as orderService from '@/services/orderService';
import * as productService from '@/services/productService';
import StatsCard from '@/components/admin/StatsCard';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice, formatDate } from '@/lib/formatters';

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
  returned: 'error',
};

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [orderData, productData] = await Promise.all([
        orderService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 }),
      ]);
      setOrders(orderData.items);
      setProducts(productData.items);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'returned')
    .reduce((sum, o) => sum + o.total, 0);

  const lowStockVariants = products.flatMap((p) =>
    p.variants.filter((v) => v.stock > 0 && v.stock <= 3).map((v) => ({
      productName: p.name,
      variantLabel: `${v.color.name}${v.size ? ' / ' + v.size : ''}`,
      stock: v.stock,
      sku: v.sku,
      productId: p.id,
    }))
  );

  const outOfStock = products.flatMap((p) =>
    p.variants.filter((v) => v.stock === 0)
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Revenue" value={formatPrice(totalRevenue)} icon={DollarSign} trend={12} />
        <StatsCard label="Total Orders" value={orders.length} icon={ShoppingCart} trend={8} />
        <StatsCard label="Products" value={products.length} icon={Package} />
        <StatsCard label="Out of Stock" value={outOfStock} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary-600 flex items-center gap-1 hover:underline">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between py-2 hover:bg-neutral-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{order.id}</p>
                  <p className="text-xs text-neutral-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                  <Badge color={STATUS_COLORS[order.status]}>{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Low Stock Alerts</h2>
            <Link to="/admin/inventory" className="text-sm text-primary-600 flex items-center gap-1 hover:underline">
              Inventory <ArrowRight size={14} />
            </Link>
          </div>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-neutral-400">No low stock items</p>
          ) : (
            <div className="space-y-3">
              {lowStockVariants.slice(0, 5).map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{v.productName}</p>
                    <p className="text-xs text-neutral-400">{v.variantLabel} · {v.sku}</p>
                  </div>
                  <Badge color="warning">{v.stock} left</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
