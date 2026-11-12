import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { filterGroups } from '@/components/storefront/FilterSidebar';
import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'rating', label: 'Best rated' },
  { value: 'name-asc', label: 'Alphabetically, A–Z' },
];

/** "Sort by" as a plain select, styled as text. */
export function SortSelect({ value, onChange }) {
  return (
    <label className="relative inline-flex items-center gap-1.5 text-sm">
      <span className="text-neutral-600 hidden sm:inline">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none [field-sizing:content] bg-transparent pr-6 py-1.5 font-medium text-black cursor-pointer focus:outline-none"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={15} className="absolute right-0 pointer-events-none" />
    </label>
  );
}

function Popover({ group, open, onToggle, onClose, onReset }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 py-1.5 text-sm transition-colors cursor-pointer',
          open || group.count > 0 ? 'text-black' : 'text-neutral-700 hover:text-black'
        )}
      >
        {group.label}
        {group.count > 0 && (
          <span className="min-w-4 h-4 px-1 rounded-full bg-black text-white text-[10px] leading-4 text-center">{group.count}</span>
        )}
        <ChevronDown size={15} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 w-72 bg-white border border-neutral-200 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)] sf-slide-down">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 text-xs">
            <span className="text-neutral-500">{group.count > 0 ? `${group.count} selected` : 'Choose'}</span>
            <button type="button" onClick={onReset} className="underline underline-offset-4 text-black disabled:text-neutral-400 cursor-pointer" disabled={group.count === 0}>
              Reset
            </button>
          </div>
          <div className="p-4">{group.body}</div>
        </div>
      )}
    </div>
  );
}

const RESET_KEYS = {
  category: { categoryId: null },
  price: { priceMin: null, priceMax: null },
  color: { colors: null },
  fabric: { fabrics: null },
  occasion: { occasions: null },
};

/** Chips for every filter that is on, each with a remove button. */
export function ActiveFilters({ filters, categories, onChange, onClear }) {
  const chips = [];
  if (filters.categoryId) {
    const cat = categories.find((c) => String(c.id) === String(filters.categoryId));
    chips.push({ key: 'cat', label: cat?.name || 'Category', patch: { categoryId: null } });
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    const from = filters.priceMin != null ? formatPrice(filters.priceMin) : '₹0';
    const to = filters.priceMax != null ? formatPrice(filters.priceMax) : 'any';
    chips.push({ key: 'price', label: `${from} – ${to}`, patch: { priceMin: null, priceMax: null } });
  }
  (filters.colors || []).forEach((c) => chips.push({ key: `c-${c}`, label: c, patch: { colors: filters.colors.filter((x) => x !== c) } }));
  (filters.fabrics || []).forEach((f) => chips.push({ key: `f-${f}`, label: f, patch: { fabrics: filters.fabrics.filter((x) => x !== f) } }));
  (filters.occasions || []).forEach((o) => chips.push({ key: `o-${o}`, label: o, patch: { occasions: filters.occasions.filter((x) => x !== o) } }));

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-4">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.patch)}
          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-neutral-300 text-xs text-black hover:border-black cursor-pointer"
        >
          {chip.label} <X size={13} />
        </button>
      ))}
      <button type="button" onClick={onClear} className="text-xs underline underline-offset-4 ml-1 cursor-pointer">
        Clear all
      </button>
    </div>
  );
}

/** Desktop filter row: one dropdown per filter. */
export default function FilterBar({ filters, onChange, showCategory = true }) {
  const [openId, setOpenId] = useState(null);
  const groups = filterGroups({ filters, onChange, showCategory });
  const close = () => setOpenId(null);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="text-sm text-neutral-500">Filter:</span>
      {groups.map((g) => (
        <Popover
          key={g.id}
          group={g}
          open={openId === g.id}
          onToggle={() => setOpenId(openId === g.id ? null : g.id)}
          onClose={close}
          onReset={() => onChange(RESET_KEYS[g.id])}
        />
      ))}
    </div>
  );
}
