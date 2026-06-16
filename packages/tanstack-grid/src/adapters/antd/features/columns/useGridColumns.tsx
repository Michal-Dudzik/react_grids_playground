// @ts-nocheck
import { useId, useMemo } from 'react';
import { EditableCell, TableCheckbox, renderHighlightedText } from '../../components/TanStackTableComponents';
import { getColumnId } from '../../../../core/tableColumns';

export function useGridColumns({
  dataColumns = [],
  editingEnabled,
  globalFilter,
  selectionMode,
  selectColumnWidth,
  slots = {},
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
        cell: (cellContext) => {
          const columnId = getColumnId(column);
          const renderPreview =
            column.meta?.renderPreview ??
            slots.cellPreviewRenderers?.[columnId] ??
            slots.cellRenderers?.[columnId] ??
            slots.renderCellPreview;

          return (
            <EditableCell
              {...cellContext}
              renderPreview={
                renderPreview
                  ? (value, searchTerm) =>
                      renderPreview({
                        column,
                        columnId,
                        renderHighlightedText,
                        searchTerm,
                        value,
                      })
                  : undefined
              }
              searchTerm={globalFilter}
            />
          );
        },
      })),
    ],
    [dataColumns, editingEnabled, globalFilter, selectColumnWidth, selectionMode, slots, tableId],
  );
}
