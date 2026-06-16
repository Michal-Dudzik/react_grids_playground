import type { Row, RowData, Table } from '@tanstack/react-table';
import { useImperativeHandle, type Ref } from 'react';
import type { GridColumnDef, TanStackGridRef } from '../types';

export interface UseGridRefParams<RowType extends RowData> {
  activateRow: (row: Row<RowType>, options?: { event?: unknown; source?: string }) => void;
  activeRow: RowType | null;
  dataColumns: GridColumnDef<RowType>[];
  printRows: (scope: 'all' | 'page' | 'selected') => void;
  ref: Ref<TanStackGridRef<RowType>>;
  syncColumnWidthsFromDom: () => void;
  table: Table<RowType>;
  visibleExportColumns: unknown[];
}

export function useGridRef<RowType extends RowData>({
  activateRow,
  activeRow,
  dataColumns,
  printRows,
  ref,
  syncColumnWidthsFromDom,
  table,
  visibleExportColumns,
}: UseGridRefParams<RowType>) {
  useImperativeHandle(
    ref,
    () => ({
      getColumns: () => dataColumns,
      getActiveRow: () => activeRow,
      getProcessedColumns: () => visibleExportColumns,
      getSelectedRows: () => table.getSelectedRowModel().rows.map((row) => row.original),
      getSelectedRowsCount: () => table.getSelectedRowModel().rows.length,
      getTableInstance: () => table,
      hasSelectedRows: () => table.getSelectedRowModel().rows.length > 0,
      setActiveRow: (rowId) => {
        const normalizedRowId = String(rowId);
        const row =
          table.getPrePaginationRowModel().rowsById[normalizedRowId] ??
          table.getRowModel().rowsById[normalizedRowId];

        if (row) {
          activateRow(row);
        }
      },
      printAll: () => printRows('all'),
      printCurrentPage: () => printRows('page'),
      printSelected: () => printRows('selected'),
      syncColumnWidths: syncColumnWidthsFromDom,
    }),
    [activeRow, activateRow, dataColumns, printRows, syncColumnWidthsFromDom, table, visibleExportColumns],
  );
}
