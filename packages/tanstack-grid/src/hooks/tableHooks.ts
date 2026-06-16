import { useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { RowData, Table } from '@tanstack/react-table';
import {
  buildColumnSettingsState,
  extractColumnsArray,
  normalizeColumnOrder,
  normalizeColumnSizing,
  normalizeColumnVisibility,
} from '../core/tableColumns';
import { normalizeFilterState } from '../core/tableFilters';
import { cloneDefaultPresentationRules, normalizePresentationRules } from '../core/tablePresentationRules';
import type { GridStateAdapter } from '../adapters/browser';
import type { GridPresentationRule } from '../types';

import type { GridColumnPreferencesAdapter } from '../types';

interface UseApiColumnsParams {
  columnRequest?: typeof fetch;
  defaultColumns: unknown[];
  fetchColumns?: boolean;
  loadColumns?: GridColumnPreferencesAdapter['load'];
  localColumns: unknown[];
  locale: string;
}

export function useApiColumns({
  defaultColumns,
  fetchColumns,
  loadColumns,
  localColumns,
  locale,
}: UseApiColumnsParams) {
  const [apiColumns, setApiColumns] = useState([]);
  const [apiColumnsLoading, setApiColumnsLoading] = useState(false);
  const [apiColumnsError, setApiColumnsError] = useState('');
  const shouldFetchColumns = fetchColumns ?? typeof loadColumns === 'function';

  useEffect(() => {
    if (!shouldFetchColumns || typeof loadColumns !== 'function') {
      setApiColumns([]);
      setApiColumnsLoading(false);
      setApiColumnsError('');
      return undefined;
    }

    const abortController = new AbortController();

    setApiColumnsLoading(true);
    setApiColumnsError('');

    Promise.resolve(loadColumns({ languageCode: locale, signal: abortController.signal }))
      .then((columnsData) => {
        if (!abortController.signal.aborted) {
          setApiColumns(extractColumnsArray(columnsData));
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setApiColumns([]);
          setApiColumnsError(error?.message || 'Failed to fetch columns.');
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setApiColumnsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [loadColumns, locale, shouldFetchColumns]);

  const sourceColumns =
    shouldFetchColumns && apiColumns.length > 0
      ? apiColumns
      : shouldFetchColumns
        ? defaultColumns
        : localColumns;

  return {
    apiColumnsError,
    apiColumnsLoading,
    shouldFetchColumns,
    sourceColumns,
  };
}

interface UseColumnSettingsStateParams {
  columnStateAdapter?: GridStateAdapter;
  currentDefaultColumnOrder: string[];
  currentDefaultColumnSizing: Record<string, number>;
  dataColumns: unknown[];
}

export function useColumnSettingsState({
  columnStateAdapter,
  currentDefaultColumnOrder,
  currentDefaultColumnSizing,
  dataColumns,
}: UseColumnSettingsStateParams) {
  const persistedColumnState = useMemo(() => columnStateAdapter?.read?.() ?? {}, [columnStateAdapter]);
  const initialColumnSettings = useMemo(() => buildColumnSettingsState(persistedColumnState), [persistedColumnState]);
  const [columnOrder, setColumnOrder] = useState(() => initialColumnSettings.columnOrder);
  const [columnSizing, setColumnSizing] = useState(() => initialColumnSettings.columnSizing);
  const [columnVisibility, setColumnVisibility] = useState(() => initialColumnSettings.columnVisibility);
  const [columnSettingsDraft, setColumnSettingsDraft] = useState(() => initialColumnSettings);

  useEffect(() => {
    setColumnOrder((currentOrder) => normalizeColumnOrder(currentOrder, currentDefaultColumnOrder));
    setColumnSizing((currentSizing) => ({
      ...currentDefaultColumnSizing,
      ...normalizeColumnSizing(currentSizing, currentDefaultColumnSizing),
    }));
    setColumnVisibility((currentVisibility) =>
      normalizeColumnVisibility(currentVisibility, currentDefaultColumnOrder),
    );
    setColumnSettingsDraft((currentDraft) => buildColumnSettingsState(currentDraft, dataColumns));
  }, [currentDefaultColumnOrder, currentDefaultColumnSizing, dataColumns]);

  useEffect(() => {
    columnStateAdapter?.write?.({
      columnOrder,
      columnSizing,
      columnVisibility,
    });
  }, [columnOrder, columnSizing, columnStateAdapter, columnVisibility]);

  return {
    columnOrder,
    columnSettingsDraft,
    columnSizing,
    columnVisibility,
    setColumnOrder,
    setColumnSettingsDraft,
    setColumnSizing,
    setColumnVisibility,
  };
}

interface UseFilterStateParams {
  currentDefaultColumnOrder: string[];
  filterStateAdapter?: GridStateAdapter;
}

export function useFilterState({ currentDefaultColumnOrder, filterStateAdapter }: UseFilterStateParams) {
  const persistedFilterState = useMemo(
    () => normalizeFilterState(filterStateAdapter?.read?.() ?? {}),
    [filterStateAdapter],
  );
  const [columnFilters, setColumnFilters] = useState(() => persistedFilterState.columnFilters);
  const [globalFilterDraft, setGlobalFilterDraft] = useState(() => persistedFilterState.globalFilter);
  const [globalFilter, setGlobalFilter] = useState(() => persistedFilterState.globalFilter);
  const [showFilters, setShowFilters] = useState(() => persistedFilterState.showFilters);

  useEffect(() => {
    setColumnFilters((currentFilters) =>
      normalizeFilterState({ columnFilters: currentFilters }, currentDefaultColumnOrder).columnFilters,
    );
  }, [currentDefaultColumnOrder]);

  useEffect(() => {
    filterStateAdapter?.write?.({
      columnFilters,
      globalFilter,
      showFilters,
    });
  }, [columnFilters, filterStateAdapter, globalFilter, showFilters]);

  return {
    columnFilters,
    globalFilter,
    globalFilterDraft,
    setColumnFilters,
    setGlobalFilter,
    setGlobalFilterDraft,
    setShowFilters,
    showFilters,
  };
}

interface UsePresentationRulesStateParams {
  presentationRulesAdapter?: GridStateAdapter<GridPresentationRule[]>;
}

export function usePresentationRulesState({ presentationRulesAdapter }: UsePresentationRulesStateParams = {}) {
  const [presentationRules, setPresentationRules] = useState<GridPresentationRule[]>(() =>
    normalizePresentationRules(presentationRulesAdapter?.read?.() ?? cloneDefaultPresentationRules()),
  );

  useEffect(() => {
    presentationRulesAdapter?.write?.(presentationRules);
  }, [presentationRules, presentationRulesAdapter]);

  return {
    presentationRules,
    setPresentationRules,
  };
}

interface UseResetPaginationOnFilterChangeParams {
  columnFilters: unknown[];
  globalFilter: string;
  setPagination: Dispatch<SetStateAction<{ pageIndex: number; pageSize: number }>>;
}

export function useResetPaginationOnFilterChange({
  columnFilters,
  globalFilter,
  setPagination,
}: UseResetPaginationOnFilterChangeParams) {
  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0
        ? current
        : {
            ...current,
            pageIndex: 0,
          },
    );
  }, [columnFilters, globalFilter, setPagination]);
}

export function useDismissibleLayer(layer: unknown, dismiss: () => void) {
  useEffect(() => {
    if (!layer) {
      return undefined;
    }

    function closeLayer() {
      dismiss();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeLayer();
      }
    }

    window.addEventListener('click', closeLayer);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeLayer);
    window.addEventListener('scroll', closeLayer, true);

    return () => {
      window.removeEventListener('click', closeLayer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeLayer);
      window.removeEventListener('scroll', closeLayer, true);
    };
  }, [dismiss, layer]);
}

interface UseAutoPageSizeParams {
  autoPageSize: boolean;
  matchingRowsLength: number;
  onPageSizeChange: (pageSize: number) => void;
  rowDensityConfig: { rowHeight: number };
  showAllRows: boolean;
  tableWrapRef: RefObject<HTMLElement | null>;
}

export function useAutoPageSize({
  autoPageSize,
  matchingRowsLength,
  onPageSizeChange,
  rowDensityConfig,
  showAllRows,
  tableWrapRef,
}: UseAutoPageSizeParams) {
  const onPageSizeChangeRef = useRef(onPageSizeChange);
  onPageSizeChangeRef.current = onPageSizeChange;

  useEffect(() => {
    if (!autoPageSize || showAllRows) {
      return undefined;
    }

    const tableWrapElement = tableWrapRef.current;

    if (!tableWrapElement) {
      return undefined;
    }

    function updateAutoPageSize() {
      const headerHeight =
        tableWrapElement.querySelector('thead')?.getBoundingClientRect().height ?? rowDensityConfig.rowHeight;
      const tableTop = tableWrapElement.getBoundingClientRect().top;
      const reservedFooterHeight = 148;
      const availableTableHeight = Math.max(
        rowDensityConfig.rowHeight * 2,
        window.innerHeight - tableTop - reservedFooterHeight,
      );
      const nextPageSize = Math.max(
        1,
        Math.min(
          Math.max(matchingRowsLength, 1),
          Math.floor((availableTableHeight - headerHeight) / rowDensityConfig.rowHeight),
        ),
      );

      onPageSizeChangeRef.current(nextPageSize);
    }

    updateAutoPageSize();

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateAutoPageSize);
    resizeObserver?.observe(tableWrapElement);
    window.addEventListener('resize', updateAutoPageSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateAutoPageSize);
    };
  }, [autoPageSize, matchingRowsLength, rowDensityConfig.rowHeight, showAllRows, tableWrapRef]);
}

interface UseSelectionReportParams<Row extends RowData = RowData> {
  getRowId?: (row: Row) => string;
  onSelectionChange?: (rows: Row[], context: { ids: string[]; table: Table<Row> }) => void;
  rowSelection: Record<string, boolean>;
  selectionMode: string;
  table: Table<Row>;
}

export function useSelectionReport<Row extends RowData = RowData>({
  getRowId = (row) => String((row as { id?: string | number }).id ?? ''),
  onSelectionChange,
  rowSelection,
  selectionMode,
  table,
}: UseSelectionReportParams<Row>) {
  const [selectedRowsReport, setSelectedRowsReport] = useState([]);

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    const selectedRowModels = table.getSelectedRowModel().rows;
    const selectedRowIds = selectedRowModels.map((row) => getRowId(row.original));

    setSelectedRowsReport(selectedRowIds);
    onSelectionChangeRef.current?.(
      selectedRowModels.map((row) => row.original),
      {
        ids: selectedRowIds,
        table,
      },
    );
  }, [getRowId, rowSelection, selectionMode, table]);

  return selectedRowsReport;
}
