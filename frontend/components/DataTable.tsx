'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from 'lucide-react';
import Loader from './Loader';

export interface Column<T = any> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  initialPageSize?: number;
  fixedHeightClass?: string; // e.g. "h-[320px]" or "h-full"
  emptyTitle?: string;
  emptySubtitle?: string;
  extraHeaderActions?: React.ReactNode;
  rowKey?: (row: T, index: number) => string | number;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = 'Search records...',
  searchKeys,
  initialPageSize = 5,
  fixedHeightClass = 'h-[320px]',
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search or filters.',
  extraHeaderActions,
  rowKey,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filtered data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = item[k as string];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }
      // Fallback: search all primitive values in the object
      return Object.values(item).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(term);
        }
        return false;
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Search & Actions Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder:text-slate-400 transition"
          />
        </div>

        {extraHeaderActions && (
          <div className="flex items-center gap-2 flex-wrap">{extraHeaderActions}</div>
        )}
      </div>

      {/* Fixed Height Scrollable Table Area */}
      <div className={`flex-1 min-h-0 ${fixedHeightClass} overflow-y-auto relative`}>
        {loading ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-20">
            <Loader label="Refreshing table records..." size="md" />
          </div>
        ) : null}

        <table className="w-full text-left border-collapse text-xs">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 z-10 shadow-xs">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3.5 py-2.5 ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <Inbox className="w-7 h-7 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-700 text-xs">{emptyTitle}</p>
                    <p className="text-[11px] text-slate-400">{emptySubtitle}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const key = rowKey ? rowKey(row, idx) : (row.id || idx);
                return (
                  <tr
                    key={key}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={`${key}-${col.key}`}
                        className={`px-3.5 py-2.5 align-middle ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, idx) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 flex-shrink-0">
        {/* Total Summary & Page Size */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            Showing <span className="font-bold text-slate-700">{startIndex}</span> to{' '}
            <span className="font-bold text-slate-700">{endIndex}</span> of{' '}
            <span className="font-bold text-slate-700">{totalItems}</span>
          </span>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Rows:</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              {[5, 10, 20].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPageSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                    pageSize === sz
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page Nav Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1 || loading}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-[11px] font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || loading}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages || loading}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

