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
  columnRequest?: typeof fetch;
  defaultColumns: GridColumnDef<Row>[];
  editingEnabled: boolean;
  getRowId: (row: Row) => string;
  loadColumns?: TanStackGridProps<Row>['columnPreferences']['load'];
  localColumns: GridColumnDef<Row>[];
  locale: string;
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
  tableData: Row[];
  transformColumnsFn?: (columns: ColumnDef<Row>[]) => ColumnDef<Row>[];
}

export function useGridTableConfiguration<Row extends RowData>({
  columnRequest = fetch,
  defaultColumns,
  editingEnabled,
  getRowId,
  loadColumns,
  localColumns,
  locale,
  pagination,
  persistence = {},
  rowSelection,
  selectionMode,
  setPagination,
  setRowSelection,
  setSorting,
  setTableData,
  slots = {},
  sorting,
  tableData,
  transformColumnsFn,
}: UseGridTableConfigurationParams<Row>) {
  const { apiColumnsError, apiColumnsLoading, sourceColumns } = useApiColumns({
    columnRequest,
    defaultColumns,
    fetchColumns: Boolean(loadColumns),
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
    getRowId,
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
          currentRows.map((row) =>
            String(getRowId(row)) === String(rowId)
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
