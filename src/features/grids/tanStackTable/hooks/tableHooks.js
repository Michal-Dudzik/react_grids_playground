import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildColumnSettingsState,
  fetchColumnsFromApi,
  normalizeColumnOrder,
  normalizeColumnSizing,
  normalizeColumnVisibility,
  readColumnState,
  writeColumnState,
} from '../lib/tableColumns';
import { normalizeFilterState, readFilterState, writeFilterState } from '../lib/tableFilters';
import { readPresentationRules, writePresentationRules } from '../lib/tablePresentationRules';

export function useApiColumns({
  appId,
  columnRequest,
  defaultColumns,
  fetchColumns,
  gridId,
  localColumns,
  locale,
}) {
  const [apiColumns, setApiColumns] = useState([]);
  const [apiColumnsLoading, setApiColumnsLoading] = useState(false);
  const [apiColumnsError, setApiColumnsError] = useState('');
  const shouldFetchColumns = fetchColumns ?? Boolean(appId && gridId);

  useEffect(() => {
    if (!shouldFetchColumns || !appId || !gridId) {
      setApiColumns([]);
      setApiColumnsLoading(false);
      setApiColumnsError('');
      return undefined;
    }

    const abortController = new AbortController();

    setApiColumnsLoading(true);
    setApiColumnsError('');

    fetchColumnsFromApi({
      appId,
      gridId,
      languageCode: locale,
      request: columnRequest,
      signal: abortController.signal,
    })
      .then((columnsData) => {
        if (!abortController.signal.aborted) {
          setApiColumns(columnsData);
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
  }, [appId, columnRequest, gridId, locale, shouldFetchColumns]);

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

export function useColumnSettingsState({
  currentDefaultColumnOrder,
  currentDefaultColumnSizing,
  dataColumns,
}) {
  const persistedColumnState = useMemo(readColumnState, []);
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
    writeColumnState({
      columnOrder,
      columnSizing,
      columnVisibility,
    });
  }, [columnOrder, columnSizing, columnVisibility]);

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

export function useFilterState({ currentDefaultColumnOrder }) {
  const persistedFilterState = useMemo(readFilterState, []);
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
    writeFilterState({
      columnFilters,
      globalFilter,
      showFilters,
    });
  }, [columnFilters, globalFilter, showFilters]);

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

export function usePresentationRulesState() {
  const [presentationRules, setPresentationRules] = useState(readPresentationRules);

  useEffect(() => {
    writePresentationRules(presentationRules);
  }, [presentationRules]);

  return {
    presentationRules,
    setPresentationRules,
  };
}

export function useResetPaginationOnFilterChange({ columnFilters, globalFilter, setPagination }) {
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

export function useDismissibleLayer(layer, dismiss) {
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

export function useAutoPageSize({
  autoPageSize,
  matchingRowsLength,
  onPageSizeChange,
  rowDensityConfig,
  showAllRows,
  tableWrapRef,
}) {
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

export function useSelectionReport({ onSelectionChange, rowSelection, selectionMode, table, tableData }) {
  const [selectedRowsReport, setSelectedRowsReport] = useState([]);

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  useEffect(() => {
    const selectedRowModels = table.getSelectedRowModel().rows;
    const selectedRowIds = selectedRowModels.map((row) => row.original.id);

    setSelectedRowsReport(selectedRowIds);
    onSelectionChangeRef.current?.(
      selectedRowModels.map((row) => row.original),
      {
        ids: selectedRowIds,
        table,
      },
    );
  }, [rowSelection, selectionMode, table, tableData]);

  return selectedRowsReport;
}
