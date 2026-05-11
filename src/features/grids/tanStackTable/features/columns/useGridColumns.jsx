import { useId, useMemo } from 'react';
import { StatusBadge } from '../../../../demoData/StatusBadge';
import { EditableCell, TableCheckbox, renderHighlightedText } from '../../components/TanStackTableComponents';
import { getColumnId } from '../../lib/tableColumns';

export function useGridColumns({
  dataColumns = [],
  editingEnabled,
  globalFilter,
  selectionMode,
  selectColumnWidth,
}) {
  const tableId = useId();
  return useMemo(
    () => [
      {
        id: 'select',
        enableResizing: false,
        enableHiding: false,
        enableColumnFilter: false,
        enableSorting: false,
        minSize: selectColumnWidth,
        size: selectColumnWidth,
        header: ({ table }) =>
          selectionMode === 'multi' ? (
            <TableCheckbox
              aria-label="Select all rows"
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          ) : (
            <span>Select</span>
          ),
        cell: ({ row }) =>
          selectionMode === 'multi' ? (
            <TableCheckbox
              aria-label={`Select ${row.original.id ?? `row ${row.index + 1}`}`}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          ) : (
            <input
              aria-label={`Select ${row.original.id ?? `row ${row.index + 1}`}`}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              name={tableId}
              onChange={row.getToggleSelectedHandler()}
              type="radio"
            />
          ),
      },
      ...dataColumns.map((column) => ({
        ...column,
        meta: {
          ...(column.meta ?? {}),
          editable: editingEnabled && Boolean(column.meta?.editable),
        },
        cell:
          getColumnId(column) === 'status'
            ? (cellContext) => (
                <EditableCell
                  {...cellContext}
                  renderPreview={(value, searchTerm) => (
                    <StatusBadge value={value}>{renderHighlightedText(value, searchTerm)}</StatusBadge>
                  )}
                  searchTerm={globalFilter}
                />
              )
            : (cellContext) => (
                <EditableCell
                  {...cellContext}
                  searchTerm={globalFilter}
                />
              ),
      })),
    ],
    [dataColumns, editingEnabled, globalFilter, selectColumnWidth, selectionMode, tableId],
  );
}
