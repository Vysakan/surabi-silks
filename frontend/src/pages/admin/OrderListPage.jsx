import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import * as orderService from '@/services/orderService';
import DataTable from '@/components/admin/DataTable';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice, formatDate } from '@/lib/formatters';
import { ORDER_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/cn';

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

const TABS = [
  { value: '', label: 'All' },
  ...Object.values(ORDER_STATUSES).map((s) => ({ value: s, label: STATUS_LABELS[s] || s })),
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await orderService.getAll({
        limit: 100,
        status: statusFilter || undefined,
      });
      setOrders(data.items);
      setLoading(false);
    }
    load();
  }, [statusFilter]);

  if (loading) return <LoadingSpinner />;

  const columns = [
    { header: 'Order #', accessor: 'id', sortable: true },
    { header: 'Customer', accessor: 'customerName', sortable: true, render: (row) => <div><p>{row.customerName}</p><p className="text-xs text-neutral-400">{row.customerEmail}</p></div> },
    {
      header: 'Date',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Items',
      render: (row) => row.items.length,
    },
    {
      header: 'Total',
      accessor: 'total',
      sortable: true,
      render: (row) => <span className="font-semibold">{formatPrice(row.total)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge color={STATUS_COLORS[row.status] || 'info'}>{STATUS_LABELS[row.status] || row.status}</Badge>,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Orders</h1>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
              statusFilter === tab.value
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-neutral-500 hover:bg-neutral-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search orders..."
        onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
      />
    </div>
  );
}
