// @ts-nocheck
import { useCallback, useMemo, useRef, useState } from 'react';
import { getColumnDisplayText } from '../../../../core/tableDisplay';
import { getCellValue } from '../../../../core/tablePresentationRules';
import {
  normalizeCustomContextMenuItems,
  prepareContextMenuItems,
} from '../../../../core/tableUtils';
import { copyText } from '../../../browser';

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
  activeColumnFilters,
  clearColumnFilters,
  clearSearch,
  contextMenuConfig = {},
  clipboardAdapter,
  copyContextRow,
  fitAllColumnWidths,
  fitColumnWidth,
  globalFilter,
  setOpenFilterColumnId,
  setShowFilters,
  table,
  getMessage = (_key, fallback) => fallback,
  updateColumnFilter,
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

  function buildHeaderContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const canSort = column?.getCanSort();
    const sortDirection = column?.getIsSorted();

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
        key: 'fit-column',
        label: getMessage('autoFitThisColumn'),
        onSelect: () => fitColumnWidth(menuState.columnId),
      },
      {
        key: 'fit-all-columns',
        label: getMessage('autoFitAllColumns'),
        onSelect: fitAllColumnWidths,
      },
    ];
  }

  function buildCellContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const row = visibleRows.find((visibleRow) => visibleRow.id === menuState.rowId);
    const canFilter = column?.getCanFilter();

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
    fitColumnWidth,
    fitAllColumnWidths,
    // cell builder deps
    visibleRows,
    copyContextRow,
    clipboardAdapter,
    updateColumnFilter,
    setShowFilters,
    setOpenFilterColumnId,
    activeColumnFilters,
    globalFilter,
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
