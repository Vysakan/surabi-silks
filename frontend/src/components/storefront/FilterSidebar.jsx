import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { cn } from '@/lib/cn';

export const COLORS = [
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

export const FABRICS = ['Pure Mulberry Silk', 'Banarasi Silk', 'Mysore Crepe Silk', 'Pure Cotton', 'Chiffon', 'Georgette', 'Linen', 'Raw Silk'];
export const OCCASIONS = ['Wedding', 'Festival', 'Daily Wear', 'Office', 'Party', 'Casual', 'Pooja'];

const toggle = (list = [], value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function Tick({ checked }) {
  return (
    <span
      className={cn(
        'w-4 h-4 shrink-0 border flex items-center justify-center rounded-[3px] transition-colors',
        checked ? 'bg-black border-black text-white' : 'border-neutral-400 bg-white'
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
  );
}

export function CategoryOptions({ filters, onChange }) {
  const { categories } = useCategoryTree();
  return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto">
      {categories.map((cat) => {
        const checked = String(filters.categoryId ?? '') === String(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange({ categoryId: checked ? null : cat.id })}
            className="flex items-center gap-2.5 text-sm text-neutral-700 hover:text-black w-full text-left cursor-pointer"
          >
            <Tick checked={checked} />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

export function PriceOptions({ filters, onChange }) {
  const input = 'w-full pl-7 pr-2 py-2 text-sm border border-neutral-300 rounded-[var(--radius-input)] focus:outline-none focus:border-black';
  return (
    <div className="flex items-center gap-2">
      <label className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-500">₹</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="From"
          aria-label="Minimum price"
          value={filters.priceMin ?? ''}
          onChange={(e) => onChange({ priceMin: e.target.value ? Number(e.target.value) : null })}
          className={input}
        />
      </label>
      <span className="text-neutral-400">–</span>
      <label className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-500">₹</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="To"
          aria-label="Maximum price"
          value={filters.priceMax ?? ''}
          onChange={(e) => onChange({ priceMax: e.target.value ? Number(e.target.value) : null })}
          className={input}
        />
      </label>
    </div>
  );
}

export function ColorOptions({ filters, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {COLORS.map((color) => {
        const active = filters.colors?.includes(color.name) || false;
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange({ colors: toggle(filters.colors, color.name) })}
            className="flex items-center gap-2 text-sm text-neutral-700 hover:text-black text-left cursor-pointer"
            aria-pressed={active}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full border shrink-0',
                active ? 'border-black ring-1 ring-black ring-offset-2' : 'border-black/15'
              )}
              style={{ backgroundColor: color.hex }}
            />
            {color.name}
          </button>
        );
      })}
    </div>
  );
}

export function ListOptions({ options, values = [], onToggle }) {
  return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto">
      {options.map((option) => {
        const checked = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className="flex items-center gap-2.5 text-sm text-neutral-700 hover:text-black w-full text-left cursor-pointer"
          >
            <Tick checked={checked} />
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** The filter groups for a page. `showCategory` is off on category pages (the URL already picks one). */
export function filterGroups({ filters, onChange, showCategory = true }) {
  const groups = [];
  if (showCategory) {
    groups.push({ id: 'category', label: 'Category', count: filters.categoryId ? 1 : 0, body: <CategoryOptions filters={filters} onChange={onChange} /> });
  }
  groups.push(
    { id: 'price', label: 'Price', count: filters.priceMin != null || filters.priceMax != null ? 1 : 0, body: <PriceOptions filters={filters} onChange={onChange} /> },
    { id: 'color', label: 'Colour', count: filters.colors?.length || 0, body: <ColorOptions filters={filters} onChange={onChange} /> },
    {
      id: 'fabric',
      label: 'Fabric',
      count: filters.fabrics?.length || 0,
      body: <ListOptions options={FABRICS} values={filters.fabrics} onToggle={(v) => onChange({ fabrics: toggle(filters.fabrics, v) })} />,
    },
    {
      id: 'occasion',
      label: 'Occasion',
      count: filters.occasions?.length || 0,
      body: <ListOptions options={OCCASIONS} values={filters.occasions} onToggle={(v) => onChange({ occasions: toggle(filters.occasions, v) })} />,
    },
  );
  return groups;
}

function Section({ label, count, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between w-full py-4 text-sm font-medium text-black cursor-pointer"
      >
        <span>{label}{count > 0 && <span className="ml-1.5 text-neutral-500 font-normal">({count})</span>}</span>
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

/**
 * Stacked, collapsible filters (used in the phone filter drawer).
 * `onFilterChange` receives only the keys that changed, e.g. { colors: ['Red'] }.
 */
export default function FilterSidebar({ filters = {}, onFilterChange, showCategory = true }) {
  const groups = filterGroups({ filters, onChange: (patch) => onFilterChange?.(patch), showCategory });
  return (
    <div className="border-t border-neutral-200">
      {groups.map((g, i) => (
        <Section key={g.id} label={g.label} count={g.count} defaultOpen={i < 2 || g.count > 0}>
          {g.body}
        </Section>
      ))}
    </div>
  );
}
