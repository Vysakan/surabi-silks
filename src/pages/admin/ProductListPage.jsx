import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Edit, Trash2 } from 'lucide-react';
import * as productService from '@/services/productService';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SmartImage from '@/components/ui/SmartImage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await productService.getAll({ limit: 100 });
      setProducts(data.items);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async () => {
    if (deleteId) {
      await productService.remove(deleteId);
      setProducts(products.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
            <SmartImage src={row.variants[0]?.images[0]} alt={row.name} containerClassName="w-full h-full" className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[200px]">{row.name}</p>
            <p className="text-xs text-neutral-400">{row.fabric}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: 'basePrice',
      sortable: true,
      render: (row) => formatPrice(row.basePrice),
    },
    {
      header: 'Variants',
      render: (row) => row.variants.length,
    },
    {
      header: 'Stock',
      render: (row) => {
        const totalStock = row.variants.reduce((sum, v) => sum + v.stock, 0);
        if (totalStock === 0) return <Badge color="error">Out of Stock</Badge>;
        if (totalStock <= 5) return <Badge color="warning">{totalStock} left</Badge>;
        return <Badge color="success">{totalStock} in stock</Badge>;
      },
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex gap-1">
          {row.isFeatured && <Badge color="primary">Featured</Badge>}
          {row.isNewArrival && <Badge color="info">New</Badge>}
          {row.isBestseller && <Badge color="warning">Bestseller</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Products ({products.length})</h1>
        <Link to="/admin/products/new">
          <Button><Plus size={16} className="mr-2" /> Add Product</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search products..."
        onRowClick={(row) => navigate(`/admin/products/${row.id}/edit`)}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Link
              to={`/admin/products/${row.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Edit size={14} className="text-neutral-400" />
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} className="text-neutral-400 hover:text-red-500" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
