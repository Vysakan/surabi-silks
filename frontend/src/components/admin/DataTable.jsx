import { useState } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  onRowClick,
  actions,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  let filtered = data;
  if (search && searchable) {
    const q = search.toLowerCase();
    filtered = data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : col.render?.(row);
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const col = columns.find((c) => c.accessor === sortKey);
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (accessor) => {
    if (!accessor) return;
    if (sortKey === accessor) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(accessor);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div>
      {searchable && (
        <div className="mb-4 relative max-w-sm">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/30"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>
      )}

      <div className="overflow-x-auto border border-neutral-100 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  className={cn(
                    'text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-neutral-700'
                  )}
                  onClick={() => col.sortable && handleSort(col.accessor)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.accessor && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-neutral-400">
                  No results found
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn('bg-white hover:bg-neutral-50 transition-colors', onRowClick && 'cursor-pointer')}
                >
                  {columns.map((col) => (
                    <td key={col.accessor || col.header} className="px-4 py-3 text-neutral-700">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
