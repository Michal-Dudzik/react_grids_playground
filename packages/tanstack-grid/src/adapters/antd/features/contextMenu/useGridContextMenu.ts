// @ts-nocheck
import { useCallback, useMemo, useRef, useState } from 'react';
import { getColumnDisplayText } from '../../../../core/tableDisplay';
import { getCellValue } from '../../../../core/tablePresentationRules';
import {
  normalizeCustomContextMenuItems,
  prepareContextMenuItems,
} from '../../../../core/tableUtils';
import { copyText, openPrintWindow } from '../../../browser';

const CONTEXT_MENU_WIDTH = 248;
// Fallback used only until the first ResizeObserver measurement arrives.
const CONTEXT_MENU_HEIGHT_FALLBACK = 360;

function getColumnLabel(column) {
  return typeof column?.columnDef.header === 'string' ? column.columnDef.header : column?.id;
}

function clampContextMenuPosition(event, menuHeight) {
  const x = Math.max(12, Math.min(event.clientX, window.innerWidth - CONTEXT_MENU_WIDTH - 12));
  const y = Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12));

  return {
    submenuPlacement: x > window.innerWidth - CONTEXT_MENU_WIDTH * 2 - 24 ? 'left' : 'right',
    x,
    y,
  };
}

export function useGridContextMenu({
  activateRow,
  activeColumnFilters,
  clearColumnFilters,
  clearSearch,
  contextMenuConfig = {},
  clipboardAdapter,
  copyContextRow,
  fitAllColumnWidths,
  fitColumnWidth,
  globalFilter,
  moveColumn,
  onOpenColumnSettings,
  orderedDataColumnIds,
  resetColumnSettings,
  rowSelection,
  selectionMode,
  setOpenFilterColumnId,
  setRowSelection,
  setShowFilters,
  syncColumnWidthsFromDom,
  table,
  printAdapter,
  getMessage = (_key, fallback) => fallback,
  updateColumnFilter,
  visibleExportColumns,
  visibleRows,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const menuHeightRef = useRef(CONTEXT_MENU_HEIGHT_FALLBACK);

  function updateMenuHeight(height) {
    menuHeightRef.current = height;
    setContextMenu((prev) => {
      if (!prev) return prev;
      const clampedY = Math.max(12, Math.min(prev.y, window.innerHeight - height - 12));
      return clampedY === prev.y ? prev : { ...prev, y: clampedY };
    });
  }

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const openHeaderContextMenu = useCallback((event, header) => {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event, menuHeightRef.current);

    setContextMenu({
      ...position,
      columnId: header.column.id,
      label: `${getMessage('columnTitlePrefix')}: ${getColumnLabel(header.column)}`,
      target: 'header',
    });
  }, []);

  const openCellContextMenu = useCallback((event, cell, row) => {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event, menuHeightRef.current);

    setContextMenu({
      ...position,
      cellId: cell.id,
      columnId: cell.column.id,
      displayValue: getColumnDisplayText(cell.column, getCellValue(row, cell.column.id), 'export'),
      label: `${row.original?.id ?? row.id ?? String(row.index ?? '<row>')} · ${getColumnLabel(cell.column)}`,
      rowId: row.id,
      target: 'cell',
      value: getCellValue(row, cell.column.id),
    });
  }, []);

  function selectContextRow(rowId, replaceSelection = selectionMode === 'single') {
    if (replaceSelection) {
      setRowSelection({ [rowId]: true });
      return;
    }

    setRowSelection((currentSelection) => ({
      ...currentSelection,
      [rowId]: true,
    }));
  }

  function toggleContextRow(rowId) {
    setRowSelection((currentSelection) => {
      if (selectionMode === 'single') {
        return currentSelection[rowId] ? {} : { [rowId]: true };
      }

      const nextSelection = { ...currentSelection };

      if (nextSelection[rowId]) {
        delete nextSelection[rowId];
      } else {
        nextSelection[rowId] = true;
      }

      return nextSelection;
    });
  }

  function buildHeaderContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const canSort = column?.getCanSort();
    const sortDirection = column?.getIsSorted();
    const dataColumnIndex = orderedDataColumnIds.indexOf(menuState.columnId);
    const canMoveColumn = dataColumnIndex !== -1;

    return [
      {
        disabled: !canSort,
        key: 'sort-ascending',
        label: getMessage('sortAscending'),
        meta: canSort && sortDirection === 'asc' ? getMessage('active') : '',
        onSelect: () => column?.toggleSorting(false),
      },
      {
        disabled: !canSort,
        key: 'sort-descending',
        label: getMessage('sortDescending'),
        meta: canSort && sortDirection === 'desc' ? getMessage('active') : '',
        onSelect: () => column?.toggleSorting(true),
      },
      {
        disabled: !sortDirection,
        key: 'clear-sort',
        label: getMessage('clearSort', 'Clear sort'),
        onSelect: () => column?.clearSorting(),
      },
      { key: 'header-separator-1', separator: true },
      {
        disabled: !column?.getCanHide(),
        key: 'hide-column',
        label: getMessage('hideColumn'),
        onSelect: () => column?.toggleVisibility(false),
      },
      {
        key: 'column-layout',
        label: getMessage('columnLayout'),
        items: [
          {
            disabled: !canMoveColumn || dataColumnIndex === 0,
            key: 'move-left',
            label: getMessage('moveLeft'),
            onSelect: () => moveColumn(menuState.columnId, -1),
          },
          {
            disabled: !canMoveColumn || dataColumnIndex === orderedDataColumnIds.length - 1,
            key: 'move-right',
            label: getMessage('moveRight'),
            onSelect: () => moveColumn(menuState.columnId, 1),
          },
          {
            key: 'fit-column',
            label: getMessage('autoFitThisColumn'),
            onSelect: () => fitColumnWidth(menuState.columnId),
          },
          {
            key: 'fit-all-columns',
            label: getMessage('autoFitAllColumns'),
            onSelect: fitAllColumnWidths,
          },
          {
            key: 'sync-rendered-widths',
            label: getMessage('syncRenderedWidths'),
            onSelect: syncColumnWidthsFromDom,
          },
          {
            key: 'reset-layout',
            label: getMessage('resetColumnLayout'),
            onSelect: resetColumnSettings,
          },
        ],
      },
      {
        key: 'open-column-settings',
        label: getMessage('openColumnSettings'),
        onSelect: onOpenColumnSettings,
      },
    ];
  }

  function buildCellContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const row = visibleRows.find((visibleRow) => visibleRow.id === menuState.rowId);
    const canFilter = column?.getCanFilter();
    const isSelected = Boolean(rowSelection[menuState.rowId]);

    return [
      {
        key: 'copy-cell',
        label: getMessage('copyCellValue', 'Copy cell value'),
        onSelect: () => (clipboardAdapter?.copyText ?? copyText)(menuState.displayValue ?? menuState.value),
      },
      {
        disabled: !row,
        key: 'copy-row',
        label: getMessage('copyRowValues', 'Copy row values'),
        onSelect: () => copyContextRow(row),
      },
      {
        disabled: !canFilter,
        key: 'filter-by-value',
        label: getMessage('filterByThisValue'),
        onSelect: () => {
          updateColumnFilter(menuState.columnId, menuState.value);
          setShowFilters(true);
          setOpenFilterColumnId(menuState.columnId);
        },
      },
      {
        disabled: (activeColumnFilters ?? 0) === 0 && !globalFilter,
        key: 'clear-all-filters',
        label: getMessage('clearAllFilters', 'Clear all filters'),
        onSelect: () => {
          clearColumnFilters();
          clearSearch();
        },
      },
      { key: 'cell-separator-1', separator: true },
      {
        key: 'row-actions',
        label: getMessage('rowActions'),
        items: [
          {
            disabled: !row,
            key: 'select-row',
            label: selectionMode === 'single' ? getMessage('selectRow') : getMessage('addRowToSelection'),
            onSelect: () => selectContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'toggle-row-selection',
            label: isSelected ? getMessage('removeFromSelection') : getMessage('addRowToSelection'),
            onSelect: () => toggleContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'activate-row',
            label: getMessage('setAsActiveRow'),
            onSelect: () => activateRow(row, { source: 'context-menu' }),
          },
          {
            disabled: !row,
            key: 'print-this-row',
            label: getMessage('printThisRow'),
            onSelect: () =>
              (printAdapter?.openPrintWindow ?? openPrintWindow)({
                columns: visibleExportColumns,
                rows: [row],
                title: `TanStack Table - ${row.original.id}`,
              }),
          },
        ],
      },
      {
        key: 'paging-actions',
        label: getMessage('paging'),
        items: [
          {
            disabled: !table.getCanPreviousPage(),
            key: 'first-page',
            label: getMessage('firstPage'),
            onSelect: () => table.setPageIndex(0),
          },
          {
            disabled: !table.getCanPreviousPage(),
            key: 'previous-page',
            label: getMessage('previousPage'),
            onSelect: () => table.previousPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'next-page',
            label: getMessage('nextPage'),
            onSelect: () => table.nextPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'last-page',
            label: getMessage('lastPage'),
            onSelect: () => table.setPageIndex(Math.max(table.getPageCount() - 1, 0)),
          },
        ],
      },
    ];
  }

  const handleContextMenuSelect = useCallback((item) => {
    if (item.disabled) {
      return;
    }

    closeContextMenu();
    try {
      item.onSelect?.();
    } catch (err) {
      console.error('[ContextMenu] onSelect threw synchronously:', err);
    }
  }, [closeContextMenu]);

  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];

    return prepareContextMenuItems(
      [
        ...(contextMenu.target === 'header'
          ? buildHeaderContextMenuItems(contextMenu)
          : contextMenu.target === 'cell'
            ? buildCellContextMenuItems(contextMenu)
            : []),
        ...normalizeCustomContextMenuItems(
          contextMenu.target === 'header' ? contextMenuConfig.headerItems : contextMenuConfig.cellItems,
          contextMenu,
        ),
      ],
      contextMenu,
      contextMenuConfig,
    );
  }, [
    contextMenu,
    contextMenuConfig,
    // header builder deps
    table,
    orderedDataColumnIds,
    moveColumn,
    fitColumnWidth,
    fitAllColumnWidths,
    syncColumnWidthsFromDom,
    resetColumnSettings,
    onOpenColumnSettings,
    // cell builder deps
    visibleRows,
    rowSelection,
    copyContextRow,
    clipboardAdapter,
    updateColumnFilter,
    setShowFilters,
    setOpenFilterColumnId,
    activeColumnFilters,
    globalFilter,
    selectionMode,
    activateRow,
    visibleExportColumns,
    printAdapter,
    getMessage,
  ]);

  return {
    closeContextMenu,
    contextMenu,
    contextMenuItems,
    handleContextMenuSelect,
    onMenuHeightChange: updateMenuHeight,
    openCellContextMenu,
    openHeaderContextMenu,
  };
}
