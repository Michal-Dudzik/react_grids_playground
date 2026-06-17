import { PrinterOutlined } from '@ant-design/icons';
import { Alert, Button, Dropdown } from 'antd';
import { forwardRef, useCallback, useEffect, type ComponentType, type ReactNode } from 'react';
import './styles.css';
import { TanStackTableSummaryPanel } from './adapters/antd/features/aggregation/TanStackTableSummaryPanel';
import { GridColumnsModal } from './adapters/antd/features/columns/GridColumnsModal';
import { useGridColumnSettings } from './adapters/antd/features/columns/useGridColumnSettings';
import { useGridContextMenu } from './adapters/antd/features/contextMenu/useGridContextMenu';
import { useGridExportPrint } from './adapters/antd/features/export/useGridExportPrint';
import { GridFooter } from './adapters/antd/features/footer/GridFooter';
import { buildGridFooterButtons } from './adapters/antd/features/footer/buildGridFooterButtons';
import { GridTemplateEditorModal } from './adapters/antd/features/presentation/GridTemplateEditorModal';
import { useGridPresentation } from './adapters/antd/features/presentation/useGridPresentation';
import { useGridSearch } from './adapters/antd/features/search/useGridSearch';
import { TanStackTableErrorBoundary, ContextMenu } from './adapters/antd/components/TanStackTableComponents';
import { TanStackTableGrid } from './adapters/antd/components/TanStackTableGrid';
import { useGridComputations } from './hooks/useGridComputations';
import { useGridRef } from './hooks/useGridRef';
import { useGridState } from './hooks/useGridState';
import { useGridTableConfiguration } from './hooks/useGridTableConfiguration';
import { useAutoPageSize, useDismissibleLayer, useSelectionReport } from './hooks/tableHooks';
import { baseColumns, initialRows } from './core/tableColumns';
import { createGridMessageResolver } from './core/gridIntl';
import {
  getEmptyAdvancedFilterValue,
  isAdvancedFilterConfigured,
  normalizeAdvancedFilterValue,
} from './core/tableFilters';
import type { TanStackGridProps, TanStackGridRef } from './types';

function getDefaultRowId(row: unknown) {
  return String((row as { id?: string | number }).id ?? '');
}

const TanStackGridContent = forwardRef<TanStackGridRef, TanStackGridProps>(function TanStackGridContent(
  {
    aggregationConfig = {},
    appId,
    autoPageSize: controlledAutoPageSize,
    clipboardAdapter,
    columnRequest = fetch,
    columnPreferences = {},
    columns: localColumns = baseColumns,
    contextMenuConfig = {},
    controlledState = {},
    defaultColumns = baseColumns,
    data: compatRows,
    editingEnabled: controlledEditingEnabled,
    exportAdapter,
    features = {},
    fetchColumns,
    getRowId = getDefaultRowId,
    getCellProps,
    getHeaderProps,
    getRowProps,
    gridId,
    enableAltRow = true,
    initialState = {},
    initialAutoPageSize = false,
    initialEditingEnabled = true,
    initialPageSize = 5,
    initialRowDensity = 'standard',
    initialSelectionMode = 'multi',
    initialShowAllRows = false,
    labels,
    loading = false,
    locale = 'en-US',
    formatMessage,
    footerConfig = {},
    onRowActivate,
    onPageSizeChange,
    onRowDoubleClick,
    onSaveColumnPreferences,
    onSearchPropsChange,
    onSelectionChange,
    persistence = {},
    pageSize: controlledPageSize,
    printAdapter,
    rowDensity: controlledRowDensity,
    rows: localRowsProp,
    selectionMode: controlledSelectionMode,
    showAllRows: controlledShowAllRows,
    slots = {},
    showColumnDividers = true,
    showRowDividers = true,
    tableProps = {},
    tableWrapperProps = {},
    transformColumnsFn,
  },
  ref,
) {
  const localRows = localRowsProp ?? compatRows ?? initialRows;
  const getMessage = createGridMessageResolver({ formatMessage, labels });

  const gridState = useGridState({
    autoPageSize: controlledAutoPageSize,
    columnPreferences,
    controlledState,
    editingEnabled: controlledEditingEnabled,
    features,
    fetchColumns,
    initialAutoPageSize,
    initialEditingEnabled,
    initialPageSize,
    initialRowDensity,
    initialSelectionMode,
    initialShowAllRows,
    initialState,
    localRows,
    onSaveColumnPreferences,
    pageSize: controlledPageSize,
    rowDensity: controlledRowDensity,
    selectionMode: controlledSelectionMode,
    showAllRows: controlledShowAllRows,
  });

  const tableConfig = useGridTableConfiguration({
    columnRequest,
    defaultColumns,
    editingEnabled: gridState.editingEnabled,
    getRowId,
    loadColumns: gridState.loadColumns,
    localColumns,
    locale,
    pagination: gridState.pagination,
    persistence,
    rowSelection: gridState.rowSelection,
    selectionMode: gridState.selectionMode,
    setPagination: gridState.setPagination,
    setRowSelection: gridState.setRowSelection,
    setSorting: gridState.setSorting,
    setTableData: gridState.setTableData,
    slots,
    sorting: gridState.sorting,
    tableData: gridState.tableData,
    transformColumnsFn,
  });

  const computations = useGridComputations({
    aggregationColumnId: gridState.aggregationColumnId,
    aggregationConfig,
    aggregationScope: gridState.aggregationScope,
    columnFilters: tableConfig.columnFilters,
    locale,
    pagination: gridState.pagination,
    rowDensity: gridState.rowDensity,
    showAllRows: gridState.showAllRows,
    table: tableConfig.table,
  });

  useEffect(() => {
    if (!tableConfig.showFilters) {
      gridState.setOpenFilterColumnId('');
    }
  }, [tableConfig.showFilters, gridState.setOpenFilterColumnId]);

  function updatePageSize(nextPageSize: number) {
    gridState.setPagination((current) =>
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

  useAutoPageSize({
    autoPageSize: gridState.autoPageSize,
    matchingRowsLength: computations.matchingRows.length,
    onPageSizeChange: updatePageSize,
    rowDensityConfig: computations.rowDensityConfig,
    showAllRows: gridState.showAllRows,
    tableWrapRef: gridState.tableWrapRef,
  });

  const { applySearch, clearSearch } = useGridSearch({
    globalFilter: tableConfig.globalFilter,
    globalFilterDraft: tableConfig.globalFilterDraft,
    onSearchPropsChange,
    setGlobalFilter: tableConfig.setGlobalFilter,
    setGlobalFilterDraft: tableConfig.setGlobalFilterDraft,
    setPagination: gridState.setPagination,
  });

  const selectedRowsReport = useSelectionReport({
    onSelectionChange,
    rowSelection: gridState.rowSelection,
    selectionMode: gridState.selectionMode,
    getRowId,
    table: tableConfig.table,
  });

  function updateColumnFilter(columnId: string, value: unknown) {
    const column = tableConfig.table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue({
      ...getEmptyAdvancedFilterValue(),
      selectedValues: [String(value ?? '')],
    });

    column?.setFilterValue(isAdvancedFilterConfigured(normalizedValue) ? normalizedValue : undefined);
  }

  function updateAdvancedColumnFilter(columnId: string, filterValue: unknown) {
    const column = tableConfig.table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue(filterValue);

    column?.setFilterValue(isAdvancedFilterConfigured(normalizedValue) ? normalizedValue : undefined);
  }

  function clearAdvancedColumnFilter(columnId: string) {
    tableConfig.table.getColumn(columnId)?.setFilterValue(undefined);
  }

  function clearColumnFilters() {
    tableConfig.setColumnFilters([]);
    gridState.setOpenFilterColumnId('');
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
    columnOrder: tableConfig.columnOrder,
    columnSettingsDraft: tableConfig.columnSettingsDraft,
    columnSizing: tableConfig.columnSizing,
    columnVisibility: tableConfig.columnVisibility,
    currentDefaultColumnOrder: tableConfig.currentDefaultColumnOrder,
    currentDefaultColumnSizing: tableConfig.currentDefaultColumnSizing,
    dataColumns: tableConfig.dataColumns,
    gridId,
    onSaveColumnPreferences: gridState.saveColumnPreferences,
    setColumnOrder: tableConfig.setColumnOrder,
    setColumnSettingsDraft: tableConfig.setColumnSettingsDraft,
    setColumnSizing: tableConfig.setColumnSizing,
    setColumnVisibility: tableConfig.setColumnVisibility,
    table: tableConfig.table,
    tableData: gridState.tableData,
    tableWrapRef: gridState.tableWrapRef,
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
    dataColumns: tableConfig.dataColumns,
    orderedDataColumnIds,
    presentationRules: tableConfig.presentationRules,
    setPresentationRules: tableConfig.setPresentationRules,
    table: tableConfig.table,
  });

  const { copyContextRow, exportFilteredRows, exportPdfView, printMenuItems, printRows } = useGridExportPrint({
    clipboardAdapter,
    exportAdapter,
    matchingRows: computations.matchingRows,
    printAdapter,
    selectedRows: computations.selectedRows,
    visibleExportColumns: computations.visibleExportColumns,
    visibleRows: computations.visibleRows,
  } as Parameters<typeof useGridExportPrint>[0]);

  const activateRow = useCallback(
    (row, { event, source = 'programmatic' }: { event?: unknown; source?: string } = {}) => {
      gridState.setActiveRow(row.original);
      onRowActivate?.(row.original, { event, row, source, table: tableConfig.table });

      if (source !== 'double-click') {
        return;
      }

      gridState.setLastDoubleClickedRow(row.original);
      onRowDoubleClick?.(row.original, { event, row, source, table: tableConfig.table });
    },
    [gridState.setActiveRow, gridState.setLastDoubleClickedRow, onRowActivate, onRowDoubleClick, tableConfig.table],
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
    activeColumnFilters: computations.activeColumnFilters,
    clearColumnFilters,
    clearSearch,
    clipboardAdapter,
    contextMenuConfig,
    copyContextRow,
    fitAllColumnWidths,
    fitColumnWidth,
    globalFilter: tableConfig.globalFilter,
    moveColumn,
    onOpenColumnSettings: openColumnSettingsModal,
    orderedDataColumnIds,
    resetColumnSettings,
    rowSelection: gridState.rowSelection,
    selectionMode: gridState.selectionMode,
    setOpenFilterColumnId: gridState.setOpenFilterColumnId,
    setRowSelection: gridState.setRowSelection,
    setShowFilters: tableConfig.setShowFilters,
    syncColumnWidthsFromDom,
    table: tableConfig.table,
    printAdapter,
    getMessage,
    updateColumnFilter,
    visibleExportColumns: computations.visibleExportColumns,
    visibleRows: computations.visibleRows,
  });

  useDismissibleLayer(contextMenu, closeContextMenu);

  useGridRef({
    ref,
    dataColumns: tableConfig.dataColumns,
    activeRow: gridState.activeRow,
    visibleExportColumns: computations.visibleExportColumns,
    table: tableConfig.table,
    activateRow,
    printRows,
    syncColumnWidthsFromDom,
  });

  const summaryItems = [
    { label: getMessage('visibleRows'), value: computations.visibleRows.length },
    { label: getMessage('matchingRows'), value: computations.matchingRows.length },
    { label: getMessage('selectedRows'), value: computations.selectedRows.length },
    { label: getMessage('selectionCallback'), value: selectedRowsReport.length > 0 ? selectedRowsReport.join(', ') : getMessage('none') },
    { label: getMessage('activeRow'), value: gridState.activeRow ? getRowId(gridState.activeRow) : getMessage('none') },
    { label: getMessage('lastDoubleClick'), value: gridState.lastDoubleClickedRow ? getRowId(gridState.lastDoubleClickedRow) : getMessage('none') },
    { label: getMessage('search'), value: tableConfig.globalFilter || getMessage('none') },
    { label: getMessage('columnFilters'), value: computations.activeColumnFilters || getMessage('none') },
    { label: getMessage('presentationRules'), value: activePresentationRules || getMessage('none') },
    { label: getMessage('density'), value: computations.rowDensityConfig.label },
    { label: getMessage('autoPageSize'), value: gridState.autoPageSize ? `${gridState.pagination.pageSize} ${getMessage('rowsSuffix')}` : getMessage('off') },
  ];

  const footerButtons = buildGridFooterButtons({
    filtering: tableConfig.showFilters,
    onColumnsSettings: openColumnSettingsModal,
    onExportExcel: exportFilteredRows,
    onExportPdf: exportPdfView,
    onPresentationSettings: () => gridState.setTemplateEditorOpen(true),
    onToggleFilter: () => tableConfig.setShowFilters((current) => !current),
    onToggleSummary: () => gridState.setShowSummary((current) => !current),
    onPrint: () => {},
    getMessage,
    footerButtons: [
      {
        component: (
          <Dropdown menu={{ items: printMenuItems }} trigger={['click']}>
            <Button aria-label={getMessage('print')} icon={<PrinterOutlined />} title={getMessage('print')} type="text" />
          </Dropdown>
        ),
        isCustomComponent: true,
        key: 'print',
        title: getMessage('print'),
      },
    ...(footerConfig.buttons ?? []),
    ],
    showColumnsSettings: footerConfig.showColumnsSettings ?? gridState.featureFlags.columnSettings,
    showExportExcel: footerConfig.showExportExcel ?? gridState.featureFlags.export,
    showExportPdf: footerConfig.showExportPdf ?? gridState.featureFlags.print,
    showFilter: footerConfig.showFilter ?? gridState.featureFlags.filtering,
    showPresentationSettings: footerConfig.showPresentationSettings ?? gridState.featureFlags.presentation,
    presentationSettingsActive: gridState.templateEditorOpen,
    showPrint: footerConfig.showPrint ?? gridState.featureFlags.print,
    showSummary: footerConfig.showSummary ?? gridState.featureFlags.summary,
    summaryVisible: gridState.showSummary,
  });

  const tableLoading = loading || tableConfig.apiColumnsLoading;

  return (
    <div className="tanstack-grid">
      <div aria-busy={tableLoading} className="tanstack-grid__surface">
        {tableLoading ? (
          <div className="tanstack-grid__loading-overlay" role="status">
            {tableConfig.apiColumnsLoading ? getMessage('loadingColumns') : getMessage('loadingTable')}
          </div>
        ) : null}

        {tableConfig.apiColumnsError ? (
          <Alert
            className="tanstack-grid__inline-panel"
            message={getMessage('columnApiFallback')}
            description={`${tableConfig.apiColumnsError} ${getMessage('renderingFallbackColumns')}`}
            showIcon
            type="warning"
          />
        ) : null}

        {gridState.showSummary ? (
          <TanStackTableSummaryPanel
            aggregateItems={computations.aggregateItems}
            aggregationColumnOptions={computations.aggregationColumnOptions}
            aggregationLabels={computations.aggregationLabels}
            aggregationScope={gridState.aggregationScope}
            onAggregationColumnChange={gridState.setAggregationColumnId}
            onAggregationScopeChange={gridState.setAggregationScope}
            selectedAggregationColumnId={computations.effectiveAggregationColumnId}
            summaryItems={summaryItems}
          />
        ) : null}

        <TanStackTableGrid
          activeRow={gridState.activeRow}
          enableAltRow={enableAltRow}
          getCellProps={getCellProps}
          getHeaderProps={getHeaderProps}
          getRowProps={getRowProps}
          onActivateRow={activateRow}
          onClearAdvancedColumnFilter={clearAdvancedColumnFilter}
          onOpenCellContextMenu={openCellContextMenu}
          onOpenHeaderContextMenu={openHeaderContextMenu}
          onToggleFilterColumn={gridState.setOpenFilterColumnId}
          onUpdateAdvancedColumnFilter={updateAdvancedColumnFilter}
          openFilterColumnId={gridState.openFilterColumnId}
          presentationRules={tableConfig.presentationRules}
          rowDensity={gridState.rowDensity}
          rowDensityConfig={computations.rowDensityConfig}
          rows={gridState.tableData}
          showColumnDividers={showColumnDividers}
          showFilters={tableConfig.showFilters}
          showRowDividers={showRowDividers}
          table={tableConfig.table}
          tableProps={tableProps}
          tableWrapRef={gridState.tableWrapRef}
          tableWrapperProps={tableWrapperProps}
          visibleRows={computations.visibleRows}
        />
        {footerConfig.showFooter !== false ? (
          <GridFooter
            attached
            buttons={footerButtons}
            currentPage={tableConfig.table.getState().pagination.pageIndex + 1}
            disablePaging={gridState.showAllRows}
            onPageChange={(page) => tableConfig.table.setPageIndex(page - 1)}
            onPageSizeChange={updatePageSize}
            pageSize={gridState.pagination.pageSize}
            pageSizeDisabled={gridState.autoPageSize}
            pageSizeOptions={computations.pageSizeOptions}
            searchProps={{
            inputValue: tableConfig.globalFilterDraft,
            onInputChange: tableConfig.setGlobalFilterDraft,
            onSearch: applySearch,
            onClear: clearSearch,
            isSearching: false,
            placeholder: getMessage('searchPlaceholder'),
          }}
            total={computations.matchingRows.length}
            hidePageCount={footerConfig.hidePageCount}
            rowsLabel={getMessage('rows')}
            totalPages={Math.max(tableConfig.table.getPageCount(), 1)}
          />

          ) : null}
      </div>

      <GridColumnsModal
        columns={columnSettingsOptions}
        description={getMessage('columnSettingsDescription')}
        error={columnSettingsError}
        isSaving={columnSettingsSaving}
        onClose={cancelColumnSettings}
        onReorderColumns={reorderColumnSettings}
        onReset={resetColumnSettingsDraft}
        onSave={saveColumnSettings}
        open={columnsModalOpen}
        title={getMessage('columnSettings')}
      />

      <GridTemplateEditorModal
        columns={columnOptions}
        onAddRule={addPresentationRule}
        onClose={() => gridState.setTemplateEditorOpen(false)}
        onDeleteRule={deletePresentationRule}
        onReorderRules={reorderPresentationRules}
        onReset={resetPresentationRules}
        onUpdateRule={updatePresentationRule}
        open={gridState.templateEditorOpen}
        rules={tableConfig.presentationRules}
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

export const TanStackGrid = forwardRef<TanStackGridRef, TanStackGridProps>(function TanStackGrid(props, ref) {
  const ErrorBoundary = TanStackTableErrorBoundary as ComponentType<{
    children?: ReactNode;
    onError?: TanStackGridProps['onError'];
  }>;

  return (
    <ErrorBoundary onError={props.onError}>
      <TanStackGridContent {...props} ref={ref} />
    </ErrorBoundary>
  );
});
