import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { PrinterOutlined } from '@ant-design/icons';
import { Alert, Button, Dropdown } from 'antd';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './tanstack-grid.css';
import { TanStackTableSummaryPanel } from './features/aggregation/TanStackTableSummaryPanel';
import { GridColumnsModal } from './features/columns/GridColumnsModal';
import { useGridColumnSettings } from './features/columns/useGridColumnSettings';
import { useGridColumns } from './features/columns/useGridColumns';
import { useGridContextMenu } from './features/contextMenu/useGridContextMenu';
import { useGridExportPrint } from './features/export/useGridExportPrint';
import { GridFooter } from './features/footer/GridFooter';
import { buildGridFooterButtons } from './features/footer/buildGridFooterButtons';
import { GridTemplateEditorModal } from './features/presentation/GridTemplateEditorModal';
import { useGridPresentation } from './features/presentation/useGridPresentation';
import { useGridSearch } from './features/search/useGridSearch';
import { TanStackTableErrorBoundary, ContextMenu } from './components/TanStackTableComponents';
import { TanStackTableGrid } from './components/TanStackTableGrid';
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
import { getAggregationColumnOptions, getColumnAggregates } from './lib/tableAggregation';
import {
  baseColumns,
  buildDefaultColumnOrder,
  buildDefaultColumnSizing,
  buildTanStackDataColumns,
  initialRows,
  saveColumnPreferencesToApi,
} from './lib/tableColumns';
import { defaultAggregationLabels, exportableFieldIds, MIN_COLUMN_WIDTH, pageSizeChoices, rowDensityConfigs } from './lib/tableConfig';
import {
  getEmptyAdvancedFilterValue,
  isAdvancedFilterActive,
  isAdvancedFilterConfigured,
  normalizeAdvancedFilterValue,
} from './lib/tableFilters';

const TanStackGridContent = forwardRef(function TanStackGridContent({
  aggregationConfig = {},
  appId,
  autoPageSize: controlledAutoPageSize,
  columnRequest = fetch,
  columns: localColumns = baseColumns,
  contextMenuConfig = {},
  defaultColumns = baseColumns,
  editingEnabled: controlledEditingEnabled,
  fetchColumns,
  getCellProps,
  getHeaderProps,
  getRowProps,
  gridId,
  enableAltRow = true,
  initialAutoPageSize = false,
  initialEditingEnabled = true,
  initialPageSize = 5,
  initialRowDensity = 'standard',
  initialSelectionMode = 'multi',
  initialShowAllRows = false,
  loading = false,
  locale = 'en-US',
  onAutoPageSizeChange,
  onEditingEnabledChange,
  onPageSizeChange,
  onRowDoubleClick,
  onSaveColumnPreferences = saveColumnPreferencesToApi,
  onSearchPropsChange,
  onRowDensityChange,
  onSelectionModeChange,
  onSelectionChange,
  onShowAllRowsChange,
  pageSize: controlledPageSize,
  rounded = true,
  rowDensity: controlledRowDensity,
  rows: localRows = initialRows,
  selectionMode: controlledSelectionMode,
  showAllRows: controlledShowAllRows,
  showColumnDividers = true,
  showRowDividers = true,
  tableProps = {},
  tableWrapperProps = {},
  transformColumnsFn,
} = {}, ref) {
  const tableWrapRef = useRef(null);
  const [tableData, setTableData] = useState(() => localRows);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectionModeState] = useState(initialSelectionMode);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: controlledPageSize ?? initialPageSize,
  });
  const [showAllRowsState] = useState(initialShowAllRows);
  const [autoPageSizeState] = useState(initialAutoPageSize);
  const [rowDensityState] = useState(initialRowDensity);
  const [editingEnabledState] = useState(initialEditingEnabled);
  const [showSummary, setShowSummary] = useState(false);
  const [aggregationScope, setAggregationScope] = useState('page');
  const [aggregationColumnId, setAggregationColumnId] = useState('revenue');
  const [activeRow, setActiveRow] = useState(null);
  const [lastDoubleClickedRow, setLastDoubleClickedRow] = useState(null);
  const [openFilterColumnId, setOpenFilterColumnId] = useState('');

  const selectionMode = controlledSelectionMode ?? selectionModeState;
  const showAllRows = controlledShowAllRows ?? showAllRowsState;
  const autoPageSize = controlledAutoPageSize ?? autoPageSizeState;
  const rowDensity = controlledRowDensity ?? rowDensityState;
  const editingEnabled = controlledEditingEnabled ?? editingEnabledState;

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

  useEffect(() => {
    if (!showFilters) {
      setOpenFilterColumnId('');
    }
  }, [showFilters]);

  useResetPaginationOnFilterChange({ columnFilters, globalFilter, setPagination });

  const columns = useGridColumns({
    dataColumns,
    editingEnabled,
    globalFilter,
    selectionMode,
    selectColumnWidth: currentDefaultColumnSizing.select,
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
  const visibleExportColumns = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== 'select' && (shouldFetchColumns || exportableFieldIds.includes(column.id)));
  const activeColumnFilters = columnFilters.filter((filter) => isAdvancedFilterActive(filter.value)).length;
  const rowDensityConfig = rowDensityConfigs[rowDensity] ?? rowDensityConfigs.standard;

  function updatePageSize(nextPageSize) {
    setPagination((current) =>
      current.pageSize === nextPageSize && current.pageIndex === 0
        ? current
        : {
            ...current,
            pageIndex: 0,
            pageSize: nextPageSize,
          },
    );

    onPageSizeChange?.(nextPageSize);
  }

  useEffect(() => {
    if (controlledPageSize === undefined) {
      return;
    }

    setPagination((current) =>
      current.pageSize === controlledPageSize
        ? current
        : {
            ...current,
            pageIndex: 0,
            pageSize: controlledPageSize,
          },
    );
  }, [controlledPageSize]);

  useAutoPageSize({
    autoPageSize,
    matchingRowsLength: matchingRows.length,
    onPageSizeChange: updatePageSize,
    rowDensityConfig,
    showAllRows,
    tableWrapRef,
  });

  const { applySearch, clearSearch } = useGridSearch({
    globalFilter,
    globalFilterDraft,
    onSearchPropsChange,
    setGlobalFilter,
    setGlobalFilterDraft,
    setPagination,
  });

  const selectedRowsReport = useSelectionReport({
    onSelectionChange,
    rowSelection,
    selectionMode,
    table,
    tableData,
  });

  function updateColumnFilter(columnId, value) {
    const column = table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue({
      ...getEmptyAdvancedFilterValue(),
      selectedValues: [String(value ?? '')],
    });

    column?.setFilterValue(isAdvancedFilterConfigured(normalizedValue) ? normalizedValue : undefined);
  }

  function updateAdvancedColumnFilter(columnId, filterValue) {
    const column = table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue(filterValue);

    column?.setFilterValue(isAdvancedFilterConfigured(normalizedValue) ? normalizedValue : undefined);
  }

  function clearAdvancedColumnFilter(columnId) {
    table.getColumn(columnId)?.setFilterValue(undefined);
  }

  function clearColumnFilters() {
    setColumnFilters([]);
    setOpenFilterColumnId('');
  }

  const {
    columnSettingsError,
    columnSettingsOptions,
    columnSettingsSaving,
    columnsModalOpen,
    fitAllColumnWidths,
    fitColumnWidth,
    moveColumn,
    openColumnSettingsModal,
    orderedDataColumnIds,
    reorderColumnSettings,
    resetColumnSettings,
    resetColumnSettingsDraft,
    saveColumnSettings,
    syncColumnWidthsFromDom,
    cancelColumnSettings,
  } = useGridColumnSettings({
    appId,
    columnOrder,
    columnSettingsDraft,
    columnSizing,
    columnVisibility,
    currentDefaultColumnOrder,
    currentDefaultColumnSizing,
    dataColumns,
    gridId,
    onSaveColumnPreferences,
    setColumnOrder,
    setColumnSettingsDraft,
    setColumnSizing,
    setColumnVisibility,
    table,
    tableData,
    tableWrapRef,
  });

  const {
    activePresentationRules,
    addPresentationRule,
    columnOptions,
    deletePresentationRule,
    reorderPresentationRules,
    resetPresentationRules,
    updatePresentationRule,
  } = useGridPresentation({
    dataColumns,
    orderedDataColumnIds,
    presentationRules,
    setPresentationRules,
    table,
  });

  const { copyContextRow, exportFilteredRows, exportPdfView, printMenuItems, printRows } = useGridExportPrint({
    matchingRows,
    selectedRows,
    visibleExportColumns,
    visibleRows,
  });

  const activateRow = useCallback(
    (row, { event, source = 'programmatic' } = {}) => {
      setActiveRow(row.original);

      if (source !== 'double-click') {
        return;
      }

      setLastDoubleClickedRow(row.original);
      onRowDoubleClick?.(row.original, { event, row, source, table });
    },
    [onRowDoubleClick, table],
  );

  const {
    closeContextMenu,
    contextMenu,
    contextMenuItems,
    handleContextMenuSelect,
    onMenuHeightChange,
    openCellContextMenu,
    openHeaderContextMenu,
  } = useGridContextMenu({
    activateRow,
    activeColumnFilters,
    clearColumnFilters,
    clearSearch,
    contextMenuConfig,
    copyContextRow,
    fitAllColumnWidths,
    fitColumnWidth,
    globalFilter,
    moveColumn,
    onOpenColumnSettings: openColumnSettingsModal,
    orderedDataColumnIds,
    resetColumnSettings,
    rowSelection,
    selectionMode,
    setOpenFilterColumnId,
    setRowSelection,
    setShowFilters,
    syncColumnWidthsFromDom,
    table,
    updateColumnFilter,
    visibleExportColumns,
    visibleRows,
  });

  useDismissibleLayer(contextMenu, closeContextMenu);

  const aggregateRows = aggregationScope === 'filtered' ? matchingRows : visibleRows;
  const aggregationLabels = {
    ...defaultAggregationLabels,
    ...(aggregationConfig.labels ?? {}),
  };
  const aggregationColumnOptions = getAggregationColumnOptions(
    visibleExportColumns,
    matchingRows,
    aggregationConfig,
  );
  const effectiveAggregationColumnId = aggregationColumnOptions.some((option) => option.key === aggregationColumnId)
    ? aggregationColumnId
    : aggregationColumnOptions[0]?.key ?? '';
  const aggregateItems = effectiveAggregationColumnId
    ? getColumnAggregates({
        aggregationConfig,
        columnId: effectiveAggregationColumnId,
        labels: aggregationLabels,
        locale,
        tableRows: aggregateRows,
      })
    : [];

  useImperativeHandle(
    ref,
    () => ({
      getColumns: () => dataColumns,
      getActiveRow: () => activeRow,
      getGridInstance: () => table,
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

  const pageSizeOptions = useMemo(
    () =>
      pageSizeChoices.includes(pagination.pageSize)
        ? pageSizeChoices
        : [...pageSizeChoices, pagination.pageSize].sort((first, second) => first - second),
    [pagination.pageSize],
  );

  const summaryItems = [
    { label: 'Visible rows', value: visibleRows.length },
    { label: 'Matching rows', value: matchingRows.length },
    { label: 'Selected rows', value: selectedRows.length },
    { label: 'Selection callback', value: selectedRowsReport.length > 0 ? selectedRowsReport.join(', ') : 'none' },
    { label: 'Active row', value: activeRow?.id ?? 'none' },
    { label: 'Last double-click', value: lastDoubleClickedRow?.id ?? 'none' },
    { label: 'Search', value: globalFilter || 'none' },
    { label: 'Column filters', value: activeColumnFilters || 'none' },
    { label: 'Presentation rules', value: activePresentationRules || 'none' },
    { label: 'Density', value: rowDensityConfig.label },
    { label: 'Auto page size', value: autoPageSize ? `${pagination.pageSize} rows` : 'off' },
  ];

  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);

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

  const tableLoading = loading || apiColumnsLoading;

  return (
    <div className={`tanstack-grid${rounded ? '' : ' tanstack-grid--square'}`}>
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

        {showSummary ? (
          <TanStackTableSummaryPanel
            aggregateItems={aggregateItems}
            aggregationColumnOptions={aggregationColumnOptions}
            aggregationLabels={aggregationLabels}
            aggregationScope={aggregationScope}
            onAggregationColumnChange={setAggregationColumnId}
            onAggregationScopeChange={setAggregationScope}
            selectedAggregationColumnId={effectiveAggregationColumnId}
            summaryItems={summaryItems}
          />
        ) : null}

        <TanStackTableGrid
          activeRow={activeRow}
          enableAltRow={enableAltRow}
          getCellProps={getCellProps}
          getHeaderProps={getHeaderProps}
          getRowProps={getRowProps}
          onActivateRow={activateRow}
          onClearAdvancedColumnFilter={clearAdvancedColumnFilter}
          onOpenCellContextMenu={openCellContextMenu}
          onOpenHeaderContextMenu={openHeaderContextMenu}
          onToggleFilterColumn={setOpenFilterColumnId}
          onUpdateAdvancedColumnFilter={updateAdvancedColumnFilter}
          openFilterColumnId={openFilterColumnId}
          presentationRules={presentationRules}
          rowDensity={rowDensity}
          rowDensityConfig={rowDensityConfig}
          rows={tableData}
          showColumnDividers={showColumnDividers}
          showFilters={showFilters}
          showRowDividers={showRowDividers}
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
          onPageSizeChange={updatePageSize}
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
        onClose={closeContextMenu}
        onHeightChange={onMenuHeightChange}
        onSelect={handleContextMenuSelect}
        state={contextMenu}
      />
    </div>
  );
});

export const TanStackGrid = forwardRef(function TanStackGrid(props, ref) {
  return (
    <TanStackTableErrorBoundary onError={props?.onError}>
      <TanStackGridContent {...props} ref={ref} />
    </TanStackTableErrorBoundary>
  );
});
