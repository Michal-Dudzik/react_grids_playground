import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type Table,
} from '@tanstack/react-table';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useGridColumns } from '../adapters/antd/features/columns/useGridColumns';
import {
  buildDefaultColumnOrder,
  buildDefaultColumnSizing,
  buildTanStackDataColumns,
  resolveGridRowId,
} from '../core/tableColumns';
import { MIN_COLUMN_WIDTH } from '../core/tableConfig';
import type { GridColumnDef, GridSlots, TanStackGridProps } from '../types';
import {
  useApiColumns,
  useColumnSettingsState,
  useFilterState,
  usePresentationRulesState,
  useResetPaginationOnFilterChange,
} from './tableHooks';

export interface UseGridTableConfigurationParams<Row extends RowData> {
  appId?: TanStackGridProps<Row>['appId'];
  columnRequest?: typeof fetch;
  defaultColumns: GridColumnDef<Row>[];
  editingEnabled: boolean;
  getRowId?: (row: Row, index: number) => string;
  gridId?: TanStackGridProps<Row>['gridId'];
  loadColumns?: TanStackGridProps<Row>['columnPreferences']['load'];
  localColumns: GridColumnDef<Row>[];
  locale: string;
  rowIdField?: keyof Row | string;
  pagination: { pageIndex: number; pageSize: number };
  persistence?: TanStackGridProps<Row>['persistence'];
  rowSelection: Record<string, boolean>;
  selectionMode: string;
  setPagination: Dispatch<SetStateAction<{ pageIndex: number; pageSize: number }>>;
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  setSorting: Dispatch<SetStateAction<SortingState>>;
  setTableData: Dispatch<SetStateAction<Row[]>>;
  slots?: GridSlots<Row>;
  sorting: SortingState;
  shouldFetchColumns?: boolean;
  tableData: Row[];
  transformColumnsFn?: (columns: ColumnDef<Row>[]) => ColumnDef<Row>[];
}

export function useGridTableConfiguration<Row extends RowData>({
  appId,
  columnRequest = fetch,
  defaultColumns,
  editingEnabled,
  getRowId,
  gridId,
  loadColumns,
  localColumns,
  locale,
  pagination,
  persistence = {},
  rowSelection,
  rowIdField,
  selectionMode,
  setPagination,
  setRowSelection,
  setSorting,
  setTableData,
  slots = {},
  sorting,
  shouldFetchColumns,
  tableData,
  transformColumnsFn,
}: UseGridTableConfigurationParams<Row>) {
  const { apiColumnsError, apiColumnsLoading, reloadColumns, sourceColumns } = useApiColumns({
    appId,
    columnRequest,
    defaultColumns,
    fetchColumns: shouldFetchColumns,
    gridId,
    loadColumns,
    localColumns,
    locale,
  });

  const dataColumns = useMemo(
    () => buildTanStackDataColumns(sourceColumns, { dataRows: tableData, transformColumnsFn }),
    [sourceColumns, tableData, transformColumnsFn],
  );
  const currentDefaultColumnOrder = useMemo(() => buildDefaultColumnOrder(dataColumns), [dataColumns]);
  const currentDefaultColumnSizing = useMemo(() => buildDefaultColumnSizing(dataColumns), [dataColumns]);
  const resolveRowId = useMemo(
    () => getRowId ?? ((row: Row, index: number) => resolveGridRowId(row, index, dataColumns, rowIdField)),
    [dataColumns, getRowId, rowIdField],
  );

  const {
    columnFilters,
    globalFilter,
    globalFilterDraft,
    setColumnFilters,
    setGlobalFilter,
    setGlobalFilterDraft,
    setShowFilters,
    showFilters,
  } = useFilterState({
    currentDefaultColumnOrder,
    filterStateAdapter: persistence.filterState,
  });
  const {
    columnOrder,
    columnSettingsDraft,
    columnSizing,
    columnVisibility,
    setColumnOrder,
    setColumnSettingsDraft,
    setColumnSizing,
    setColumnVisibility,
  } = useColumnSettingsState({
    columnStateAdapter: persistence.columnState,
    currentDefaultColumnOrder,
    currentDefaultColumnSizing,
    dataColumns,
  });
  const { presentationRules, setPresentationRules } = usePresentationRulesState({
    presentationRulesAdapter: persistence.presentationRules,
  });

  useResetPaginationOnFilterChange({ columnFilters, globalFilter, setPagination });

  const columns = useGridColumns({
    dataColumns,
    editingEnabled,
    globalFilter,
    selectionMode,
    selectColumnWidth: currentDefaultColumnSizing.select,
    slots,
  });

  const table = useReactTable({
    columns,
    data: tableData,
    columnResizeMode: 'onChange',
    defaultColumn: {
      minSize: MIN_COLUMN_WIDTH,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: resolveRowId,
    enableRowSelection: true,
    enableMultiRowSelection: selectionMode === 'multi',
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    meta: {
      updateData: (rowId, columnId, value) => {
        setTableData((currentRows) =>
          currentRows.map((row, index) =>
            String(resolveRowId(row, index)) === String(rowId)
              ? ({ ...(row as Record<string, unknown>), [columnId]: value } as Row)
              : row,
          ),
        );
      },
    },
    state: {
      columnFilters,
      columnOrder,
      columnSizing,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
      sorting,
    },
  }) as Table<Row>;

  return {
    apiColumnsError,
    apiColumnsLoading,
    columnFilters,
    columnOrder,
    columnSettingsDraft,
    columnSizing,
    columnVisibility,
    currentDefaultColumnOrder,
    currentDefaultColumnSizing,
    dataColumns,
    globalFilter,
    globalFilterDraft,
    presentationRules,
    reloadColumns,
    setColumnFilters,
    setColumnOrder,
    setColumnSettingsDraft,
    setColumnSizing,
    setColumnVisibility,
    setGlobalFilter,
    setGlobalFilterDraft,
    setPresentationRules,
    setShowFilters,
    showFilters,
    table,
  };
}
