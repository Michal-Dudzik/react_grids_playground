import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Alert, Button, Dropdown } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { StatusBadge } from '../../demoData/StatusBadge';
import { GridColumnsModal } from './components/GridColumnsModal';
import { GridFooter } from './components/GridFooter';
import { GridTemplateEditorModal } from './components/GridTemplateEditorModal';
import { buildGridFooterButtons } from './components/buildGridFooterButtons';
import { defaultAggregationLabels, exportableFieldIds, pageSizeChoices, rowDensityConfigs } from './lib/tableConfig';
import { getAggregationColumnOptions, getColumnAggregates } from './lib/tableAggregation';
import {
  getEmptyAdvancedFilterValue,
  isAdvancedFilterActive,
  normalizeAdvancedFilterValue,
} from './lib/tableFilters';
import {
  cloneDefaultPresentationRules,
  createPresentationRule,
  getCellValue,
  normalizePresentationRules,
} from './lib/tablePresentationRules';
import {
  baseColumns,
  buildColumnPreferencesPayload,
  buildColumnSettingsState,
  buildDefaultColumnOrder,
  buildDefaultColumnSizing,
  buildTanStackDataColumns,
  getColumnId,
  initialRows,
  normalizeColumnOrder,
  saveColumnPreferencesToApi,
} from './lib/tableColumns';
import {
  useApiColumns,
  useAutoPageSize,
  useColumnSettingsState,
  useDismissibleLayer,
  useFilterState,
  usePresentationRulesState,
  useResetPaginationOnFilterChange,
  useSelectionReport,
} from './hooks/tableHooks';
import {
  TanStackTableFiltersPanel,
  TanStackTableSummaryPanel,
  TanStackTableToolbar,
} from './components/TanStackTablePanels';
import { TanStackTableGrid } from './components/TanStackTableGrid';
import {
  buildCsvContent,
  buildCsvValue,
  copyText,
  downloadCsvFile,
  normalizeCustomContextMenuItems,
  openPrintWindow,
  prepareContextMenuItems,
  reorderItems,
} from './lib/tableUtils';
import { getColumnDisplayText } from './lib/tableDisplay.js';
import {
  ContextMenu,
  EditableCell,
  TanStackTableErrorBoundary,
  TableCheckbox,
  renderHighlightedText,
} from './components/TanStackTableComponents';

const TanStackTablePreviewContent = forwardRef(function TanStackTablePreviewContent({
  aggregationConfig = {},
  appId,
  columnRequest = fetch,
  columns: localColumns = baseColumns,
  contextMenuConfig = {},
  defaultColumns = baseColumns,
  fetchColumns,
  getCellProps,
  getHeaderProps,
  getRowProps,
  gridId,
  loading = false,
  locale = 'en-US',
  onRowDoubleClick,
  onSaveColumnPreferences = saveColumnPreferencesToApi,
  onSearchPropsChange,
  onSelectionChange,
  rows: localRows = initialRows,
  tableProps = {},
  tableWrapperProps = {},
  transformColumnsFn,
} = {}, ref) {
  const tableWrapRef = useRef(null);
  const [tableData, setTableData] = useState(() => localRows);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectionMode, setSelectionMode] = useState('multi');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [showAllRows, setShowAllRows] = useState(false);
  const [autoPageSize, setAutoPageSize] = useState(false);
  const [rowDensity, setRowDensity] = useState('standard');
  const [editingEnabled, setEditingEnabled] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [aggregationScope, setAggregationScope] = useState('page');
  const [aggregationColumnId, setAggregationColumnId] = useState('revenue');
  const [lastDoubleClickedRow, setLastDoubleClickedRow] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [openFilterColumnId, setOpenFilterColumnId] = useState('');
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [columnSettingsSaving, setColumnSettingsSaving] = useState(false);
  const [columnSettingsError, setColumnSettingsError] = useState('');
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const { apiColumnsError, apiColumnsLoading, shouldFetchColumns, sourceColumns } = useApiColumns({
    appId,
    columnRequest,
    defaultColumns,
    fetchColumns,
    gridId,
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
  } = useFilterState({ currentDefaultColumnOrder });
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
    currentDefaultColumnOrder,
    currentDefaultColumnSizing,
    dataColumns,
  });
  const { presentationRules, setPresentationRules } = usePresentationRulesState();

  useEffect(() => {
    setRowSelection({});
  }, [selectionMode]);

  useEffect(() => {
    setTableData(Array.isArray(localRows) ? localRows : []);
  }, [localRows]);

  useResetPaginationOnFilterChange({ columnFilters, globalFilter, setPagination });
  useDismissibleLayer(contextMenu, () => setContextMenu(null));

  const columns = useMemo(
    () => [
      {
        id: 'select',
        enableHiding: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: currentDefaultColumnSizing.select,
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
              aria-label={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          ) : (
            <input
              aria-label={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              name="tanstack-selection"
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
    [currentDefaultColumnSizing.select, dataColumns, editingEnabled, globalFilter, selectionMode],
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
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
          currentRows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)),
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
  });

  const matchingRows = table.getPrePaginationRowModel().rows;
  const visibleRows = showAllRows ? matchingRows : table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;
  const aggregateRows = aggregationScope === 'filtered' ? matchingRows : visibleRows;
  const visibleExportColumns = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== 'select' && (shouldFetchColumns || exportableFieldIds.includes(column.id)));
  const aggregationLabels = {
    ...defaultAggregationLabels,
    ...(aggregationConfig.labels ?? {}),
  };
  const aggregationColumnOptions = getAggregationColumnOptions(
    visibleExportColumns,
    matchingRows,
    aggregationConfig,
  );
  const selectedAggregationColumnId = aggregationColumnOptions.some((option) => option.key === aggregationColumnId)
    ? aggregationColumnId
    : aggregationColumnOptions[0]?.key ?? '';
  const aggregateItems = selectedAggregationColumnId
    ? getColumnAggregates({
        aggregationConfig,
        columnId: selectedAggregationColumnId,
        labels: aggregationLabels,
        locale,
        tableRows: aggregateRows,
      })
    : [];
  const activeColumnFilters = columnFilters.filter((filter) => isAdvancedFilterActive(filter.value)).length;
  const activePresentationRules = presentationRules.filter((rule) => rule.enabled).length;
  const rowDensityConfig = rowDensityConfigs[rowDensity] ?? rowDensityConfigs.standard;
  const pageSizeOptions = useMemo(
    () =>
      pageSizeChoices.includes(pagination.pageSize)
        ? pageSizeChoices
        : [...pageSizeChoices, pagination.pageSize].sort((first, second) => first - second),
    [pagination.pageSize],
  );

  useEffect(() => {
    if (aggregationColumnId !== selectedAggregationColumnId) {
      setAggregationColumnId(selectedAggregationColumnId);
    }
  }, [aggregationColumnId, selectedAggregationColumnId]);
  useAutoPageSize({
    autoPageSize,
    matchingRowsLength: matchingRows.length,
    rowDensityConfig,
    setPagination,
    showAllRows,
    tableWrapRef,
  });
  const selectedRowsReport = useSelectionReport({
    onSelectionChange,
    rowSelection,
    selectionMode,
    table,
    tableData,
  });

  function applySearch(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setGlobalFilter(globalFilterDraft.trim());
    table.setPageIndex(0);
  }

  function clearSearch() {
    setGlobalFilterDraft('');
    setGlobalFilter('');
    table.setPageIndex(0);
  }

  useEffect(() => {
    onSearchPropsChange?.({
      appliedSearchTerm: globalFilter,
      clearSearch,
      executeSearch: applySearch,
      inputValue: globalFilterDraft,
      isSearching: false,
      setInputValue: setGlobalFilterDraft,
    });
  }, [globalFilter, globalFilterDraft, onSearchPropsChange]);

  function updateColumnFilter(columnId, value) {
    const column = table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue({
      ...getEmptyAdvancedFilterValue(),
      selectedValues: [String(value ?? '')],
    });

    column?.setFilterValue(isAdvancedFilterActive(normalizedValue) ? normalizedValue : undefined);
  }

  function updateAdvancedColumnFilter(columnId, filterValue) {
    const column = table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue(filterValue);

    column?.setFilterValue(isAdvancedFilterActive(normalizedValue) ? normalizedValue : undefined);
  }

  function clearAdvancedColumnFilter(columnId) {
    table.getColumn(columnId)?.setFilterValue(undefined);
  }

  function clearColumnFilters() {
    setColumnFilters([]);
    setOpenFilterColumnId('');
  }

  function exportFilteredRows() {
    const csvContent = buildCsvContent(visibleExportColumns, matchingRows);
    downloadCsvFile('tanstack-table-export.csv', csvContent);
  }

  function printRows(mode) {
    const printableRows =
      mode === 'selected' ? selectedRows : mode === 'all' ? matchingRows : visibleRows;

    if (printableRows.length === 0) {
      return;
    }

    const printTitle =
      mode === 'selected'
        ? 'TanStack Table - Selected Rows'
        : mode === 'all'
          ? 'TanStack Table - All Filtered Rows'
          : 'TanStack Table - Current Page';

    openPrintWindow({
      columns: visibleExportColumns,
      rows: printableRows,
      title: printTitle,
    });
  }

  function exportPdfView() {
    printRows('all');
  }

  function moveColumn(columnId, direction) {
    setColumnOrder((currentOrder) => {
      const normalizedOrder = normalizeColumnOrder(currentOrder, currentDefaultColumnOrder);
      const movableColumnIds = normalizedOrder.filter((id) => id !== 'select');
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return normalizedOrder;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return ['select', ...nextOrder];
    });
  }

  function moveDraftColumn(columnId, direction) {
    setColumnSettingsDraft((currentDraft) => {
      const normalizedOrder = normalizeColumnOrder(currentDraft.columnOrder, currentDefaultColumnOrder);
      const movableColumnIds = normalizedOrder.filter((id) => id !== 'select');
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return currentDraft;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return {
        ...currentDraft,
        columnOrder: ['select', ...nextOrder],
      };
    });
  }

  function reorderColumnSettings(activeColumnId, overColumnId) {
    setColumnSettingsDraft((currentDraft) => ({
      ...currentDraft,
      columnOrder: [
        'select',
        ...reorderItems(
          normalizeColumnOrder(currentDraft.columnOrder, currentDefaultColumnOrder).filter(
            (columnId) => columnId !== 'select',
          ),
          activeColumnId,
          overColumnId,
        ),
      ],
    }));
  }

  function updateColumnWidth(columnId, width) {
    const numericWidth = Number(width);

    if (!Number.isFinite(numericWidth)) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      [columnId]: Math.max(80, numericWidth),
    }));
  }

  function updateDraftColumnWidth(columnId, width) {
    const numericWidth = Number(width);

    if (!Number.isFinite(numericWidth)) {
      return;
    }

    setColumnSettingsDraft((currentDraft) => ({
      ...currentDraft,
      columnSizing: {
        ...currentDraft.columnSizing,
        [columnId]: Math.max(80, numericWidth),
      },
    }));
  }

  function resetColumnSettings() {
    setColumnOrder(currentDefaultColumnOrder);
    setColumnSizing(currentDefaultColumnSizing);
    setColumnVisibility({});
  }

  function resetColumnSettingsDraft() {
    setColumnSettingsError('');
    setColumnSettingsDraft(buildColumnSettingsState({}, dataColumns));
  }

  function openColumnSettingsModal() {
    setColumnSettingsDraft(
      buildColumnSettingsState({
        columnOrder,
        columnSizing,
        columnVisibility,
      }, dataColumns),
    );
    setColumnSettingsError('');
    setColumnsModalOpen(true);
  }

  function cancelColumnSettings() {
    setColumnSettingsDraft(
      buildColumnSettingsState({
        columnOrder,
        columnSizing,
        columnVisibility,
      }, dataColumns),
    );
    setColumnSettingsError('');
    setColumnsModalOpen(false);
  }

  async function saveColumnSettings() {
    const nextColumnSettings = buildColumnSettingsState(columnSettingsDraft, dataColumns);
    const columnPreferencesPayload = buildColumnPreferencesPayload(nextColumnSettings, dataColumns);

    setColumnSettingsSaving(true);
    setColumnSettingsError('');

    try {
      await onSaveColumnPreferences({
        appId,
        gridId,
        payload: columnPreferencesPayload,
      });

      setColumnOrder(nextColumnSettings.columnOrder);
      setColumnSizing(nextColumnSettings.columnSizing);
      setColumnVisibility(nextColumnSettings.columnVisibility);
      setColumnsModalOpen(false);
    } catch (error) {
      setColumnSettingsError(error?.message || 'Failed to save column preferences.');
    } finally {
      setColumnSettingsSaving(false);
    }
  }

  function addPresentationRule() {
    const fallbackField = orderedDataColumnIds[0] ?? dataColumns[0]?.accessorKey ?? 'status';

    setPresentationRules((currentRules) => [
      ...currentRules,
      createPresentationRule({
        field: fallbackField,
      }),
    ]);
  }

  function updatePresentationRule(ruleId, patch) {
    setPresentationRules((currentRules) =>
      normalizePresentationRules(
        currentRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
      ),
    );
  }

  function deletePresentationRule(ruleId) {
    setPresentationRules((currentRules) => currentRules.filter((rule) => rule.id !== ruleId));
  }

  function reorderPresentationRules(activeRuleId, overRuleId) {
    setPresentationRules((currentRules) => reorderItems(currentRules, activeRuleId, overRuleId));
  }

  function resetPresentationRules() {
    setPresentationRules(cloneDefaultPresentationRules());
  }

  function getColumnLabel(column) {
    return typeof column?.columnDef.header === 'string' ? column.columnDef.header : column?.id;
  }

  function clampContextMenuPosition(event) {
    const menuWidth = 248;
    const menuHeight = 360;
    const x = Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12));
    const y = Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12));

    return {
      submenuPlacement: x > window.innerWidth - menuWidth * 2 - 24 ? 'left' : 'right',
      x,
      y,
    };
  }

  function openHeaderContextMenu(event, header) {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event);

    setContextMenu({
      ...position,
      columnId: header.column.id,
      label: `Column: ${getColumnLabel(header.column)}`,
      target: 'header',
    });
  }

  function openCellContextMenu(event, cell, row) {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event);

    setContextMenu({
      ...position,
      cellId: cell.id,
      columnId: cell.column.id,
      displayValue: getColumnDisplayText(cell.column, getCellValue(row, cell.column.id), 'export'),
      label: `${row.original.id} · ${getColumnLabel(cell.column)}`,
      rowId: row.id,
      target: 'cell',
      value: getCellValue(row, cell.column.id),
    });
  }

  function fitColumnWidth(columnId) {
    if (columnId === 'select') {
      updateColumnWidth(columnId, currentDefaultColumnSizing.select);
      return;
    }

    const column = table.getColumn(columnId);
    const headerText = getColumnLabel(column) ?? columnId;
    const longestTextLength = tableData.reduce(
      (length, row) => Math.max(length, String(row[columnId] ?? '').length),
      String(headerText).length,
    );
    const measuredWidth = Math.min(300, Math.max(96, longestTextLength * 9 + 48));

    updateColumnWidth(columnId, measuredWidth);
  }

  function fitAllColumnWidths() {
    currentDefaultColumnOrder.forEach((columnId) => fitColumnWidth(columnId));
  }

  function readRenderedColumnWidths() {
    const tableWrapElement = tableWrapRef.current;

    if (!tableWrapElement) {
      return {};
    }

    return Array.from(tableWrapElement.querySelectorAll('thead th[data-column-id]')).reduce(
      (widths, headerCell) => {
        const columnId = headerCell.getAttribute('data-column-id');

        if (!columnId) {
          return widths;
        }

        return {
          ...widths,
          [columnId]: Math.max(72, Math.round(headerCell.getBoundingClientRect().width)),
        };
      },
      {},
    );
  }

  function syncColumnWidthsFromDom() {
    const renderedWidths = readRenderedColumnWidths();

    if (Object.keys(renderedWidths).length === 0) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      ...renderedWidths,
    }));
  }

  function activateRow(row, event) {
    setLastDoubleClickedRow(row.original);
    onRowDoubleClick?.(row.original, { event, row, table });
  }

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

  function copyContextRow(row) {
    const content = visibleExportColumns
      .map((column) => buildCsvValue(getColumnDisplayText(column, row.original[column.id], 'export')))
      .join(',');
    copyText(content);
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
        label: 'Sort ascending',
        meta: canSort && sortDirection === 'asc' ? 'Active' : '',
        onSelect: () => column?.toggleSorting(false),
      },
      {
        disabled: !canSort,
        key: 'sort-descending',
        label: 'Sort descending',
        meta: canSort && sortDirection === 'desc' ? 'Active' : '',
        onSelect: () => column?.toggleSorting(true),
      },
      {
        disabled: !sortDirection,
        key: 'clear-sort',
        label: 'Clear sort',
        onSelect: () => column?.clearSorting(),
      },
      { key: 'header-separator-1', separator: true },
      {
        disabled: !column?.getCanHide(),
        key: 'hide-column',
        label: 'Hide column',
        onSelect: () => column?.toggleVisibility(false),
      },
      {
        key: 'column-layout',
        label: 'Column layout',
        items: [
          {
            disabled: !canMoveColumn || dataColumnIndex === 0,
            key: 'move-left',
            label: 'Move left',
            onSelect: () => moveColumn(menuState.columnId, -1),
          },
          {
            disabled: !canMoveColumn || dataColumnIndex === orderedDataColumnIds.length - 1,
            key: 'move-right',
            label: 'Move right',
            onSelect: () => moveColumn(menuState.columnId, 1),
          },
          {
            key: 'fit-column',
            label: 'Auto fit this column',
            onSelect: () => fitColumnWidth(menuState.columnId),
          },
          {
            key: 'fit-all-columns',
            label: 'Auto fit all columns',
            onSelect: fitAllColumnWidths,
          },
          {
            key: 'sync-rendered-widths',
            label: 'Sync rendered widths',
            onSelect: syncColumnWidthsFromDom,
          },
          {
            key: 'reset-layout',
            label: 'Reset column layout',
            onSelect: resetColumnSettings,
          },
        ],
      },
      {
        key: 'open-column-settings',
        label: 'Open column settings',
        onSelect: openColumnSettingsModal,
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
        label: 'Copy cell value',
        onSelect: () => copyText(menuState.displayValue ?? menuState.value),
      },
      {
        disabled: !row,
        key: 'copy-row',
        label: 'Copy row values',
        onSelect: () => copyContextRow(row),
      },
      {
        disabled: !canFilter,
        key: 'filter-by-value',
        label: 'Filter by this value',
        onSelect: () => {
          updateColumnFilter(menuState.columnId, menuState.value);
          setShowFilters(true);
        },
      },
      {
        disabled: activeColumnFilters === 0 && !globalFilter,
        key: 'clear-all-filters',
        label: 'Clear all filters',
        onSelect: () => {
          clearColumnFilters();
          clearSearch();
        },
      },
      { key: 'cell-separator-1', separator: true },
      {
        key: 'row-actions',
        label: 'Row actions',
        items: [
          {
            disabled: !row,
            key: 'select-row',
            label: selectionMode === 'single' ? 'Select row' : 'Add row to selection',
            onSelect: () => selectContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'toggle-row-selection',
            label: isSelected ? 'Remove from selection' : 'Toggle row selection',
            onSelect: () => toggleContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'activate-row',
            label: 'Set as active row',
            onSelect: () => activateRow(row),
          },
          {
            disabled: !row,
            key: 'print-this-row',
            label: 'Print this row',
            onSelect: () =>
              openPrintWindow({
                columns: visibleExportColumns,
                rows: [row],
                title: `TanStack Table - ${row.original.id}`,
              }),
          },
        ],
      },
      {
        key: 'paging-actions',
        label: 'Paging',
        items: [
          {
            disabled: !table.getCanPreviousPage(),
            key: 'first-page',
            label: 'First page',
            onSelect: () => table.setPageIndex(0),
          },
          {
            disabled: !table.getCanPreviousPage(),
            key: 'previous-page',
            label: 'Previous page',
            onSelect: () => table.previousPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'next-page',
            label: 'Next page',
            onSelect: () => table.nextPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'last-page',
            label: 'Last page',
            onSelect: () => table.setPageIndex(Math.max(table.getPageCount() - 1, 0)),
          },
        ],
      },
    ];
  }

  function handleContextMenuSelect(item) {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
    setContextMenu(null);
  }

  useImperativeHandle(
    ref,
    () => ({
      getColumns: () => dataColumns,
      getGridInstance: () => table,
      getProcessedColumns: () => visibleExportColumns,
      getSelectedRows: () => table.getSelectedRowModel().rows.map((row) => row.original),
      getSelectedRowsCount: () => table.getSelectedRowModel().rows.length,
      getTableInstance: () => table,
      hasSelectedRows: () => table.getSelectedRowModel().rows.length > 0,
      printAll: () => printRows('all'),
      printCurrentPage: () => printRows('page'),
      printSelected: () => printRows('selected'),
      syncColumnWidths: syncColumnWidthsFromDom,
    }),
    [dataColumns, ref, table, visibleExportColumns],
  );

  const orderedDataColumnIds = normalizeColumnOrder(columnOrder, currentDefaultColumnOrder).filter(
    (columnId) => columnId !== 'select',
  );
  const columnOptions = orderedDataColumnIds
    .map((columnId) => table.getColumn(columnId))
    .filter(Boolean)
    .map((column) => ({
      key: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
    }));
  const draftDataColumnIds = normalizeColumnOrder(
    columnSettingsDraft.columnOrder,
    currentDefaultColumnOrder,
  ).filter((columnId) => columnId !== 'select');
  const columnSettingsOptions = draftDataColumnIds
    .map((columnId) => table.getColumn(columnId))
    .filter(Boolean)
    .map((column, index) => ({
      key: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
      checked: columnSettingsDraft.columnVisibility[column.id] !== false,
      canMoveDown: index < draftDataColumnIds.length - 1,
      canMoveUp: index > 0,
      disabled: !column.getCanHide(),
      minWidth: 80,
      onChange: (checked) =>
        setColumnSettingsDraft((currentDraft) => ({
          ...currentDraft,
          columnVisibility: {
            ...currentDraft.columnVisibility,
            [column.id]: checked,
          },
        })),
      onMoveDown: () => moveDraftColumn(column.id, 1),
      onMoveUp: () => moveDraftColumn(column.id, -1),
      onWidthChange: (width) => updateDraftColumnWidth(column.id, width),
      width: columnSettingsDraft.columnSizing[column.id] ?? column.getSize(),
    }));

  const summaryItems = [
    { label: 'Visible rows', value: visibleRows.length },
    { label: 'Matching rows', value: matchingRows.length },
    { label: 'Selected rows', value: selectedRows.length },
    { label: 'Selection callback', value: selectedRowsReport.length > 0 ? selectedRowsReport.join(', ') : 'none' },
    { label: 'Last double-click', value: lastDoubleClickedRow?.id ?? 'none' },
    { label: 'Search', value: globalFilter || 'none' },
    { label: 'Column filters', value: activeColumnFilters || 'none' },
    { label: 'Presentation rules', value: activePresentationRules || 'none' },
    { label: 'Density', value: rowDensityConfig.label },
    { label: 'Auto page size', value: autoPageSize ? `${pagination.pageSize} rows` : 'off' },
  ];

  const printMenuItems = [
    {
      key: 'current-page',
      label: 'Print current page',
      onClick: () => printRows('page'),
    },
    {
      key: 'all-filtered',
      label: 'Print all filtered rows',
      onClick: () => printRows('all'),
    },
    {
      key: 'selected',
      disabled: selectedRows.length === 0,
      label: 'Print selected rows',
      onClick: () => printRows('selected'),
    },
  ];

  const footerButtons = buildGridFooterButtons({
    filtering: showFilters,
    onColumnsSettings: openColumnSettingsModal,
    onExportExcel: exportFilteredRows,
    onExportPdf: exportPdfView,
    onPresentationSettings: () => setTemplateEditorOpen(true),
    onToggleFilter: () => setShowFilters((current) => !current),
    onToggleSummary: () => setShowSummary((current) => !current),
    footerButtons: [
      {
        component: (
          <Dropdown menu={{ items: printMenuItems }} trigger={['click']}>
            <Button aria-label="Print" icon={<PrinterOutlined />} title="Print" type="text" />
          </Dropdown>
        ),
        isCustomComponent: true,
        key: 'print',
        title: 'Print',
      },
    ],
    showColumnsSettings: true,
    showExportExcel: true,
    showExportPdf: true,
    showFilter: true,
    showPresentationSettings: true,
    presentationSettingsActive: templateEditorOpen,
    showPrint: true,
    showSummary: true,
    summaryVisible: showSummary,
  });

  const baseContextMenuItems =
    contextMenu?.target === 'header'
      ? buildHeaderContextMenuItems(contextMenu)
      : contextMenu?.target === 'cell'
        ? buildCellContextMenuItems(contextMenu)
        : [];
  const contextMenuItems = contextMenu
    ? prepareContextMenuItems(
        [
          ...baseContextMenuItems,
          ...normalizeCustomContextMenuItems(
            contextMenu.target === 'header' ? contextMenuConfig.headerItems : contextMenuConfig.cellItems,
            contextMenu,
          ),
        ],
        contextMenu,
        contextMenuConfig,
      )
    : [];
  const tableLoading = loading || apiColumnsLoading;

  return (
    <div className="tanstack-grid">
      <TanStackTableToolbar
        autoPageSize={autoPageSize}
        editingEnabled={editingEnabled}
        onAutoPageSizeChange={setAutoPageSize}
        onEditingEnabledChange={setEditingEnabled}
        onPageSizeChange={(pageSize) =>
          setPagination((current) => ({
            ...current,
            pageIndex: 0,
            pageSize,
          }))
        }
        onRowDensityChange={setRowDensity}
        onSelectionModeChange={setSelectionMode}
        onShowAllRowsChange={setShowAllRows}
        pageSize={pagination.pageSize}
        pageSizeOptions={pageSizeOptions}
        rowDensity={rowDensity}
        selectionMode={selectionMode}
        showAllRows={showAllRows}
      />

      <div aria-busy={tableLoading} className="tanstack-grid__surface">
        {tableLoading ? (
          <div className="tanstack-grid__loading-overlay" role="status">
            {apiColumnsLoading ? 'Loading columns...' : 'Loading table...'}
          </div>
        ) : null}

        {apiColumnsError ? (
          <Alert
            className="tanstack-grid__inline-panel"
            message="Column API fallback"
            description={`${apiColumnsError} Rendering fallback columns.`}
            showIcon
            type="warning"
          />
        ) : null}

        {showFilters ? (
          <TanStackTableFiltersPanel
            activeColumnFilters={activeColumnFilters}
            columns={table.getVisibleLeafColumns().filter((column) => column.id !== 'select')}
            onClearAdvancedColumnFilter={clearAdvancedColumnFilter}
            onClearColumnFilters={clearColumnFilters}
            onToggleColumn={setOpenFilterColumnId}
            onUpdateAdvancedColumnFilter={updateAdvancedColumnFilter}
            openFilterColumnId={openFilterColumnId}
            rows={tableData}
          />
        ) : null}

        {showSummary ? (
          <TanStackTableSummaryPanel
            aggregateItems={aggregateItems}
            aggregationColumnOptions={aggregationColumnOptions}
            aggregationLabels={aggregationLabels}
            aggregationScope={aggregationScope}
            onAggregationColumnChange={setAggregationColumnId}
            onAggregationScopeChange={setAggregationScope}
            selectedAggregationColumnId={selectedAggregationColumnId}
            summaryItems={summaryItems}
          />
        ) : null}

        <TanStackTableGrid
          getCellProps={getCellProps}
          getHeaderProps={getHeaderProps}
          getRowProps={getRowProps}
          lastDoubleClickedRow={lastDoubleClickedRow}
          onActivateRow={activateRow}
          onOpenCellContextMenu={openCellContextMenu}
          onOpenHeaderContextMenu={openHeaderContextMenu}
          presentationRules={presentationRules}
          rowDensity={rowDensity}
          rowDensityConfig={rowDensityConfig}
          table={table}
          tableProps={tableProps}
          tableWrapRef={tableWrapRef}
          tableWrapperProps={tableWrapperProps}
          visibleRows={visibleRows}
        />

        <GridFooter
          attached
          buttons={footerButtons}
          currentPage={table.getState().pagination.pageIndex + 1}
          disablePaging={showAllRows}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          onNextPage={() => table.nextPage()}
          onPageSizeChange={(nextPageSize) =>
            setPagination((current) => ({
              ...current,
              pageIndex: 0,
              pageSize: nextPageSize,
            }))
          }
          onPreviousPage={() => table.previousPage()}
          pageSize={pagination.pageSize}
          pageSizeDisabled={autoPageSize}
          pageSizeOptions={pageSizeOptions}
          searchProps={{
            inputValue: globalFilterDraft,
            onInputChange: setGlobalFilterDraft,
            onSearch: applySearch,
            onClear: clearSearch,
            isSearching: false,
            placeholder: 'Search',
          }}
          total={matchingRows.length}
          totalPages={Math.max(table.getPageCount(), 1)}
        />
      </div>

      <GridColumnsModal
        columns={columnSettingsOptions}
        description="Choose visibility, order, and fixed widths for the TanStack columns. Settings persist in local storage for this preview."
        error={columnSettingsError}
        isSaving={columnSettingsSaving}
        onClose={cancelColumnSettings}
        onReorderColumns={reorderColumnSettings}
        onReset={resetColumnSettingsDraft}
        onSave={saveColumnSettings}
        open={columnsModalOpen}
      />

      <GridTemplateEditorModal
        columns={columnOptions}
        onAddRule={addPresentationRule}
        onClose={() => setTemplateEditorOpen(false)}
        onDeleteRule={deletePresentationRule}
        onReorderRules={reorderPresentationRules}
        onReset={resetPresentationRules}
        onUpdateRule={updatePresentationRule}
        open={templateEditorOpen}
        rules={presentationRules}
      />

      <ContextMenu
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
        onSelect={handleContextMenuSelect}
        state={contextMenu}
      />
    </div>
  );
});

export const TanStackTablePreview = forwardRef(function TanStackTablePreview(props, ref) {
  return (
    <TanStackTableErrorBoundary onError={props?.onError}>
      <TanStackTablePreviewContent {...props} ref={ref} />
    </TanStackTableErrorBoundary>
  );
});
