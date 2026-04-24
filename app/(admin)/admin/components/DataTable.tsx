'use client';

import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  MdAdd,
  MdArrowDownward,
  MdArrowUpward,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdFilterList,
  MdRefresh,
  MdSearch,
  MdUnfoldMore,
} from 'react-icons/md';
import { formatDate } from '@/app/utils';

export interface DataColumn<T = any> {
  key: string;
  label: string;
  hidden?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

export interface SelectionConfig<T = any> {
  bulkActions: (rows: T[], ids: string[], clear: () => void) => ReactNode;
  isSelectable?: (row: T) => boolean;
}

export interface DataTableProps<T = any> {
  fetchUrl: string;
  staticParams?: Record<string, string>;
  keyColumn?: string;
  columns: DataColumn<T>[];
  search?: { placeholder?: string; paramKey?: string };
  filters?: FilterDef[];
  pagination?: { perPage?: number; pageSizes?: number[] } | false;
  defaultSort?: { key: string; order: 'asc' | 'desc' };
  actions?: (row: T) => ReactNode;
  selection?: SelectionConfig<T>;
  onCreate?: () => void;
  createLabel?: string;
  toolbarExtras?: ReactNode;
  emptyMessage?: string;
  urlSync?: boolean | { prefix?: string };
}

export interface DataTableHandle {
  reload: () => Promise<void>;
  setPage: (page: number) => void;
  clearSelection: () => void;
  getState: () => {
    page: number;
    q: string;
    filters: Record<string, string>;
    sort: { key: string; order: 'asc' | 'desc' } | null;
    selectedIds: string[];
  };
}

const DEFAULT_PER_PAGE = 20;
const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];
const SEARCH_DEBOUNCE_MS = 300;

function renderCellValue(column: DataColumn, row: any): ReactNode {
  if (column.render) return column.render(row);
  const value = row[column.key];
  if (value === null || value === undefined) return '—';
  if (
    typeof value === 'string' &&
    value.includes('T') &&
    !isNaN(Date.parse(value))
  ) {
    return formatDate(value);
  }
  if (typeof value === 'object') {
    return value.name || value.title || value.label || JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function DataTableInner<T extends Record<string, any>>(
  props: DataTableProps<T>,
  forwardedRef: ForwardedRef<DataTableHandle>
) {
  const {
    fetchUrl,
    staticParams,
    keyColumn = 'id',
    columns,
    search,
    filters,
    pagination,
    defaultSort,
    actions,
    selection,
    onCreate,
    createLabel = 'Create',
    toolbarExtras,
    emptyMessage,
    urlSync,
  } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paginationEnabled = pagination !== false;
  const perPageDefault = paginationEnabled
    ? pagination?.perPage ?? DEFAULT_PER_PAGE
    : 0;
  const pageSizeOptions = paginationEnabled
    ? pagination?.pageSizes ?? DEFAULT_PAGE_SIZES
    : [];
  const searchParamKey = search?.paramKey ?? 'q';

  const urlPrefix =
    typeof urlSync === 'object' && urlSync?.prefix ? `${urlSync.prefix}_` : '';
  const urlSyncEnabled = Boolean(urlSync);
  const pk = useCallback((k: string) => `${urlPrefix}${k}`, [urlPrefix]);

  const readInitial = useCallback(() => {
    if (!urlSyncEnabled) {
      return {
        page: 1,
        perPage: perPageDefault,
        q: '',
        filterValues: Object.fromEntries(
          (filters ?? []).map((f) => [f.key, f.defaultValue ?? ''])
        ),
        sort: defaultSort ?? null,
      };
    }
    const qs = searchParams;
    const readPage = Number(qs.get(pk('page')));
    const readPerPage = Number(qs.get(pk('perPage')));
    const sortKey = qs.get(pk('sort'));
    const sortOrder = qs.get(pk('order'));
    const sort =
      sortKey && (sortOrder === 'asc' || sortOrder === 'desc')
        ? { key: sortKey, order: sortOrder as 'asc' | 'desc' }
        : defaultSort ?? null;
    const filterValues: Record<string, string> = {};
    (filters ?? []).forEach((f) => {
      const v = qs.get(pk(f.key));
      filterValues[f.key] = v ?? f.defaultValue ?? '';
    });
    return {
      page: Number.isFinite(readPage) && readPage > 0 ? readPage : 1,
      perPage:
        Number.isFinite(readPerPage) && readPerPage > 0
          ? readPerPage
          : perPageDefault,
      q: qs.get(pk(searchParamKey)) ?? '',
      filterValues,
      sort,
    };
  }, [
    urlSyncEnabled,
    searchParams,
    pk,
    filters,
    defaultSort,
    perPageDefault,
    searchParamKey,
  ]);

  const initial = useMemo(readInitial, []); // read once, on mount

  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [qInput, setQInput] = useState(initial.q);
  const [q, setQ] = useState(initial.q);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    initial.filterValues
  );
  const [sort, setSort] = useState<{
    key: string;
    order: 'asc' | 'desc';
  } | null>(initial.sort);

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const requestIdRef = useRef(0);
  const didMountRef = useRef(false);

  // Debounce the search input
  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== qInput) {
        setQ(qInput);
        setPage(1);
        setSelectedIds(new Set());
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [qInput, q]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (staticParams) {
      for (const [k, v] of Object.entries(staticParams)) params.set(k, v);
    }
    if (paginationEnabled) {
      params.set('page', String(page));
      params.set('perPage', String(perPage));
    }
    if (q) params.set(searchParamKey, q);
    if (sort) {
      params.set('sort', sort.key);
      params.set('order', sort.order);
    }
    (filters ?? []).forEach((f) => {
      const v = filterValues[f.key];
      if (v && v !== (f.defaultValue ?? '')) params.set(f.key, v);
    });
    return params.toString();
  }, [
    staticParams,
    paginationEnabled,
    page,
    perPage,
    q,
    searchParamKey,
    sort,
    filters,
    filterValues,
  ]);

  const fetchData = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery();
      const url = qs ? `${fetchUrl}?${qs}` : fetchUrl;
      const res = await fetch(url);
      const result = await res.json();
      if (reqId !== requestIdRef.current) return;
      if (result?.success) {
        const rows: T[] = Array.isArray(result.data) ? result.data : [];
        setData(rows);
        setTotal(
          typeof result.total === 'number' ? result.total : rows.length
        );
      } else {
        setData([]);
        setTotal(0);
        setError(result?.error || 'Failed to load data');
      }
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [buildQuery, fetchUrl]);

  // Refetch when any query-affecting state changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // If the current page ends up empty (e.g., after sort or mutation), drop to page 1 once.
  useEffect(() => {
    if (!loading && paginationEnabled && page > 1 && data.length === 0 && total > 0) {
      setPage(1);
    }
  }, [loading, paginationEnabled, page, data.length, total]);

  // Mirror state into the URL (after mount, to avoid clobbering the initial read).
  useEffect(() => {
    if (!urlSyncEnabled) return;
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string | null) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    };
    setOrDelete(pk(searchParamKey), q || null);
    setOrDelete(pk('page'), paginationEnabled && page > 1 ? String(page) : null);
    setOrDelete(
      pk('perPage'),
      paginationEnabled && perPage !== perPageDefault ? String(perPage) : null
    );
    setOrDelete(pk('sort'), sort?.key ?? null);
    setOrDelete(pk('order'), sort?.order ?? null);
    (filters ?? []).forEach((f) => {
      const v = filterValues[f.key];
      setOrDelete(pk(f.key), v && v !== (f.defaultValue ?? '') ? v : null);
    });
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // We intentionally do not re-run on every searchParams change; state is source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, perPage, sort, filterValues]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  useImperativeHandle(
    forwardedRef,
    () => ({
      reload: async () => {
        setSelectedIds(new Set());
        await fetchData();
      },
      setPage: (p: number) => setPage(p),
      clearSelection,
      getState: () => ({
        page,
        q,
        filters: filterValues,
        sort,
        selectedIds: Array.from(selectedIds),
      }),
    }),
    [fetchData, page, q, filterValues, sort, selectedIds, clearSelection]
  );

  const visibleColumns = columns.filter((c) => !c.hidden);

  const handleSortClick = (column: DataColumn) => {
    if (!column.sortable) return;
    const key = column.sortKey ?? column.key;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, order: 'asc' };
      if (prev.order === 'asc') return { key, order: 'desc' };
      return null;
    });
  };

  const filtersActive =
    Boolean(q) ||
    (filters ?? []).some(
      (f) =>
        filterValues[f.key] &&
        filterValues[f.key] !== (f.defaultValue ?? '')
    );

  const clearFilters = () => {
    setQInput('');
    setQ('');
    setFilterValues(
      Object.fromEntries(
        (filters ?? []).map((f) => [f.key, f.defaultValue ?? ''])
      )
    );
    setPage(1);
    setSelectedIds(new Set());
  };

  // --- selection helpers ---
  const isSelectable = selection?.isSelectable ?? (() => true);
  const selectableRowsOnPage = data.filter(isSelectable);
  const pageAllSelected =
    selection !== undefined &&
    selectableRowsOnPage.length > 0 &&
    selectableRowsOnPage.every((r) => selectedIds.has(r[keyColumn]));
  const pageSomeSelected =
    selection !== undefined &&
    !pageAllSelected &&
    selectableRowsOnPage.some((r) => selectedIds.has(r[keyColumn]));

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) {
        selectableRowsOnPage.forEach((r) => next.delete(r[keyColumn]));
      } else {
        selectableRowsOnPage.forEach((r) => next.add(r[keyColumn]));
      }
      return next;
    });
  };

  const toggleRowSelection = (row: T) => {
    const id = row[keyColumn] as string;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = useMemo(
    () => data.filter((r) => selectedIds.has(r[keyColumn])),
    [data, selectedIds, keyColumn]
  );

  // --- pagination math ---
  const totalPages =
    paginationEnabled && perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          {search !== undefined ? (
            <div className="relative flex-1 min-w-[220px]">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={search.placeholder ?? 'Search...'}
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Filters */}
          {(filters ?? []).map((f) => (
            <div key={f.key} className="relative min-w-[180px]">
              <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterValues[f.key] ?? f.defaultValue ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterValues((prev) => ({ ...prev, [f.key]: v }));
                  setPage(1);
                  setSelectedIds(new Set());
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                aria-label={f.label}
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Count + actions */}
          <div className="flex items-center gap-3 lg:ml-auto">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {loading ? 'Loading…' : `${total} total`}
            </span>
            {toolbarExtras}
            {onCreate && (
              <button
                onClick={onCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm whitespace-nowrap"
              >
                <MdAdd className="w-5 h-5" />
                <span>{createLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selection && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              {selectedIds.size} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
            >
              <MdClose className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            {selection.bulkActions(
              selectedRows,
              Array.from(selectedIds),
              clearSelection
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-900"
          >
            <MdRefresh className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        {loading && data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-gray-600 mt-4">Loading…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <MdFilterList className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filtersActive ? 'No matches' : emptyMessage ?? 'No items found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filtersActive
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first item.'}
            </p>
            {filtersActive ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear filters
              </button>
            ) : (
              onCreate && (
                <button
                  onClick={onCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <MdAdd className="w-5 h-5" />
                  <span>{createLabel}</span>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-20 pointer-events-none">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {selection && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select page"
                        checked={pageAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = pageSomeSelected;
                        }}
                        onChange={togglePageSelection}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  {visibleColumns.map((column) => {
                    const key = column.sortKey ?? column.key;
                    const isSorted = sort?.key === key;
                    const clickable = Boolean(column.sortable);
                    return (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          clickable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                        }`}
                        onClick={() => clickable && handleSortClick(column)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {column.label}
                          {clickable &&
                            (isSorted ? (
                              sort!.order === 'asc' ? (
                                <MdArrowUpward className="w-3.5 h-3.5" />
                              ) : (
                                <MdArrowDownward className="w-3.5 h-3.5" />
                              )
                            ) : (
                              <MdUnfoldMore className="w-3.5 h-3.5 text-gray-300" />
                            ))}
                        </span>
                      </th>
                    );
                  })}
                  {actions && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row) => {
                  const rowId = row[keyColumn] as string;
                  const checked = selectedIds.has(rowId);
                  const selectable = isSelectable(row);
                  return (
                    <tr
                      key={rowId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {selection && (
                        <td className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            aria-label={`Select row ${rowId}`}
                            checked={checked}
                            disabled={!selectable}
                            onChange={() => toggleRowSelection(row)}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            column.className ?? ''
                          }`}
                        >
                          {renderCellValue(column, row)}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {actions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {paginationEnabled && data.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold">{rangeStart}</span>–
            <span className="font-semibold">{rangeEnd}</span> of{' '}
            <span className="font-semibold">{total}</span>
          </div>
          <div className="flex items-center gap-3">
            {pageSizeOptions.length > 0 && (
              <label className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Per page</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PageNumbers
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PageNumbers({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | 'ellipsis')[] = [];
  const add = (n: number | 'ellipsis') => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) add(i);
    if (page < totalPages - 2) add('ellipsis');
    add(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        aria-label="Previous page"
      >
        <MdChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-[32px] px-2 py-1 rounded border text-sm ${
              p === page
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        aria-label="Next page"
      >
        <MdChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const DataTableWithRef = forwardRef(DataTableInner) as <
  T extends Record<string, any>,
>(
  props: DataTableProps<T> & { ref?: ForwardedRef<DataTableHandle> }
) => ReactElement;

function DataTableFallback() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
    </div>
  );
}

// Suspense wrapper lets `useSearchParams()` inside the inner component work
// under static/server rendering without forcing every caller to set
// `export const dynamic = 'force-dynamic'`.
const DataTable = forwardRef(function DataTableWithSuspense<
  T extends Record<string, any>,
>(props: DataTableProps<T>, ref: ForwardedRef<DataTableHandle>) {
  return (
    <Suspense fallback={<DataTableFallback />}>
      <DataTableWithRef {...(props as any)} ref={ref} />
    </Suspense>
  );
}) as <T extends Record<string, any>>(
  props: DataTableProps<T> & { ref?: ForwardedRef<DataTableHandle> }
) => ReactElement;

export default DataTable;
