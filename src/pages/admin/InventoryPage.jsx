import { useState, useEffect } from 'react';
import * as productService from '@/services/productService';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/cn';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low Stock (≤5)' },
  { value: 'out', label: 'Out of Stock' },
  { value: 'in', label: 'In Stock' },
];

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const data = await productService.getAll({ limit: 100 });
      setProducts(data.items);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productName: p.name,
      variantId: v.id,
      color: v.color.name,
      size: v.size || '-',
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      image: v.images[0],
    }))
  );

  let filtered = variants;
  if (filter === 'low') filtered = variants.filter((v) => v.stock > 0 && v.stock <= 5);
  else if (filter === 'out') filtered = variants.filter((v) => v.stock === 0);
  else if (filter === 'in') filtered = variants.filter((v) => v.stock > 0);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (v) => v.productName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q)
    );
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const outOfStock = variants.filter((v) => v.stock === 0).length;
  const lowStock = variants.filter((v) => v.stock > 0 && v.stock <= 5).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Inventory</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-neutral-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold">{totalStock}</p>
          <p className="text-xs text-neutral-500">Total Units</p>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-orange-600">{lowStock}</p>
          <p className="text-xs text-neutral-500">Low Stock</p>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-red-600">{outOfStock}</p>
          <p className="text-xs text-neutral-500">Out of Stock</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                filter === f.value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-neutral-500 hover:bg-neutral-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg max-w-xs focus:outline-none focus:ring-2 focus:ring-primary-400/30"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-neutral-100 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Variant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Price</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No variants found</td></tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.variantId} className="bg-white hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-10 rounded bg-neutral-100 overflow-hidden shrink-0">
                        <img src={v.image} alt="" loading="lazy" onError={(e) => { e.target.src = '/images/products/fabrics-stack.png'; }} className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate max-w-[180px]">{v.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{v.color} / {v.size}</td>
                  <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{v.sku}</td>
                  <td className="px-4 py-3">{formatPrice(v.price)}</td>
                  <td className="px-4 py-3">
                    {v.stock === 0 ? (
                      <Badge color="error">Out</Badge>
                    ) : v.stock <= 5 ? (
                      <Badge color="warning">{v.stock}</Badge>
                    ) : (
                      <Badge color="success">{v.stock}</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
