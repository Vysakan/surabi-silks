import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { cn } from '@/lib/cn';

const COLORS = [
  { name: 'Red', hex: '#CC0000' },
  { name: 'Maroon', hex: '#800020' },
  { name: 'Blue', hex: '#000080' },
  { name: 'Green', hex: '#006400' },
  { name: 'Gold', hex: '#D4A017' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Pink', hex: '#FF69B4' },
  { name: 'Purple', hex: '#6A0DAD' },
  { name: 'Yellow', hex: '#FFD700' },
];

const FABRICS = ['Pure Mulberry Silk', 'Banarasi Silk', 'Mysore Crepe Silk', 'Pure Cotton', 'Chiffon', 'Georgette', 'Linen', 'Raw Silk'];
const OCCASIONS = ['Wedding', 'Festival', 'Daily Wear', 'Office', 'Party', 'Casual', 'Pooja'];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-100 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-medium text-neutral-800"
      >
        {title}
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({ filters = {}, onFilterChange, onClear }) {
  const update = (key, value) => onFilterChange?.({ ...filters, [key]: value });
  const { categories } = useCategoryTree();

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-800">Filters</h3>
        {Object.keys(filters).length > 0 && (
          <button onClick={onClear} className="text-xs text-primary-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <FilterSection title="Category">
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-neutral-800">
              <input
                type="radio"
                name="category"
                checked={String(filters.categoryId ?? '') === String(cat.id)}
                onChange={() => update('categoryId', cat.id)}
                className="accent-primary-500"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => update('priceMin', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg"
          />
          <span className="text-neutral-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => update('priceMax', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg"
          />
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => {
            const active = filters.colors?.includes(color.name);
            return (
              <button
                key={color.name}
                title={color.name}
                onClick={() => {
                  const current = filters.colors || [];
                  update(
                    'colors',
                    active ? current.filter((c) => c !== color.name) : [...current, color.name]
                  );
                }}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  active ? 'border-primary-400 ring-2 ring-primary-200' : 'border-neutral-200 hover:border-neutral-400'
                )}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Fabric */}
      <FilterSection title="Fabric" defaultOpen={false}>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {FABRICS.map((fabric) => {
            const active = filters.fabrics?.includes(fabric);
            return (
              <label key={fabric} className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active || false}
                  onChange={() => {
                    const current = filters.fabrics || [];
                    update('fabrics', active ? current.filter((f) => f !== fabric) : [...current, fabric]);
                  }}
                  className="accent-primary-500"
                />
                {fabric}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Occasion */}
      <FilterSection title="Occasion" defaultOpen={false}>
        <div className="space-y-1.5">
          {OCCASIONS.map((occasion) => {
            const active = filters.occasions?.includes(occasion);
            return (
              <label key={occasion} className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active || false}
                  onChange={() => {
                    const current = filters.occasions || [];
                    update('occasions', active ? current.filter((o) => o !== occasion) : [...current, occasion]);
                  }}
                  className="accent-primary-500"
                />
                {occasion}
              </label>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}
