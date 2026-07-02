import { PrinterOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
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
import { createGridMessageResolver } from './core/gridIntl';
import { buildGridThemeStyle, mergeGridComponents, useGridConfig } from './config/GridProvider';
import {
  getEmptyAdvancedFilterValue,
  isAdvancedFilterConfigured,
  normalizeAdvancedFilterValue,
} from './core/tableFilters';
import type { GridErrorPanelProps, TanStackGridProps, TanStackGridRef } from './types';

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
    columns: localColumnsProp,
    contextMenuConfig = {},
    controlledState = {},
    defaultColumns,
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
    initialAutoPageSize,
    initialEditingEnabled,
    initialPageSize,
    initialRowDensity,
    initialSelectionMode,
    initialShowAllRows,
    labels,
    loading = false,
    locale,
    formatMessage,
    components,
    themeTokens,
    footerConfig,
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
  const providerConfig = useGridConfig();
  const effectiveLocale = locale ?? providerConfig.locale ?? 'en-US';
  const effectiveFormatMessage = formatMessage ?? providerConfig.formatMessage;
  const effectiveLabels = {
    ...(providerConfig.labels ?? {}),
    ...(labels ?? {}),
  };
  const effectiveComponents = mergeGridComponents(providerConfig.components, components);
  const effectiveThemeStyle = buildGridThemeStyle({
    ...(providerConfig.themeTokens ?? {}),
    ...(themeTokens ?? {}),
  });
  const providerDefaults = providerConfig.defaults ?? {};
  const effectiveFooterConfig = {
    ...(providerDefaults.footerConfig ?? {}),
    ...(footerConfig ?? {}),
  };
  const effectiveFeatures = {
    ...(providerDefaults.features ?? {}),
    ...features,
  };
  const effectiveInitialAutoPageSize = initialAutoPageSize ?? providerDefaults.initialAutoPageSize ?? true;
  const effectiveInitialEditingEnabled = initialEditingEnabled ?? providerDefaults.initialEditingEnabled ?? true;
  const effectiveInitialPageSize = initialPageSize ?? providerDefaults.initialPageSize ?? 10;
  const effectiveInitialRowDensity = initialRowDensity ?? providerDefaults.initialRowDensity ?? 'standard';
  const effectiveInitialSelectionMode = initialSelectionMode ?? providerDefaults.initialSelectionMode ?? 'multi';
  const effectiveInitialShowAllRows = initialShowAllRows ?? providerDefaults.initialShowAllRows ?? false;
  const localRows = localRowsProp ?? compatRows ?? [];
  const localColumns = localColumnsProp ?? [];
  const effectiveDefaultColumns = defaultColumns ?? localColumns;
  const EmptyState = effectiveComponents.EmptyState;
  const ErrorPanel = effectiveComponents.ErrorPanel;
  const LoadingOverlay = effectiveComponents.LoadingOverlay;
  const ModalComponent = effectiveComponents.Modal;
  const Spinner = effectiveComponents.Spinner;
  const getMessage = createGridMessageResolver({ formatMessage: effectiveFormatMessage, labels: effectiveLabels });

  const gridState = useGridState({
    autoPageSize: controlledAutoPageSize,
    columnPreferences,
    controlledState,
    editingEnabled: controlledEditingEnabled,
    features: effectiveFeatures,
    fetchColumns,
    initialAutoPageSize: effectiveInitialAutoPageSize,
    initialEditingEnabled: effectiveInitialEditingEnabled,
    initialPageSize: effectiveInitialPageSize,
    initialRowDensity: effectiveInitialRowDensity,
    initialSelectionMode: effectiveInitialSelectionMode,
    initialShowAllRows: effectiveInitialShowAllRows,
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
    defaultColumns: effectiveDefaultColumns,
    editingEnabled: gridState.editingEnabled,
    getRowId,
    loadColumns: gridState.loadColumns,
    localColumns,
    locale: effectiveLocale,
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
    locale: effectiveLocale,
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
    openColumnSettingsModal,
    orderedDataColumnIds,
    reorderColumnSettings,
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

  const showExportPdf = effectiveFooterConfig.showExportPdf ?? gridState.featureFlags.print;

  const { copyContextRow, exportFilteredRows, printMenuItems, printRows } = useGridExportPrint({
    clipboardAdapter,
    exportAdapter,
    exportPdfLabel: getMessage('exportPdf'),
    includeExportPdf: showExportPdf,
    matchingRows: computations.matchingRows,
    presentationRules: tableConfig.presentationRules,
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
    activeColumnFilters: computations.activeColumnFilters,
    clearColumnFilters,
    clearSearch,
    clipboardAdapter,
    contextMenuConfig,
    copyContextRow,
    fitAllColumnWidths,
    fitColumnWidth,
    globalFilter: tableConfig.globalFilter,
    setOpenFilterColumnId: gridState.setOpenFilterColumnId,
    setShowFilters: tableConfig.setShowFilters,
    table: tableConfig.table,
    getMessage,
    updateColumnFilter,
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
    ...(effectiveFooterConfig.buttons ?? []),
    ],
    showColumnsSettings: effectiveFooterConfig.showColumnsSettings ?? gridState.featureFlags.columnSettings,
    showExportExcel: effectiveFooterConfig.showExportExcel ?? gridState.featureFlags.export,
    showExportPdf: false,
    showFilter: effectiveFooterConfig.showFilter ?? gridState.featureFlags.filtering,
    showPresentationSettings: effectiveFooterConfig.showPresentationSettings ?? gridState.featureFlags.presentation,
    presentationSettingsActive: gridState.templateEditorOpen,
    showPrint: effectiveFooterConfig.showPrint ?? gridState.featureFlags.print,
    showSummary: effectiveFooterConfig.showSummary ?? gridState.featureFlags.summary,
    summaryVisible: gridState.showSummary,
  });

  const tableLoading = loading || tableConfig.apiColumnsLoading;

  return (
    <div className="tanstack-grid" style={effectiveThemeStyle}>
      <div aria-busy={tableLoading} className="tanstack-grid__surface">
        {tableLoading ? (
          <LoadingOverlay
            label={tableConfig.apiColumnsLoading ? getMessage('loadingColumns') : getMessage('loadingTable')}
            Spinner={Spinner}
          />
        ) : null}

        {tableConfig.apiColumnsError ? (
          <ErrorPanel
            className="tanstack-grid__inline-panel"
            message={getMessage('columnApiFallback')}
            description={`${tableConfig.apiColumnsError} ${getMessage('renderingFallbackColumns')}`}
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
          EmptyState={EmptyState}
          getMessage={getMessage}
        />
        {effectiveFooterConfig.showFooter !== false ? (
          <GridFooter
            attached
            buttons={footerButtons}
            currentPage={tableConfig.table.getState().pagination.pageIndex + 1}
            disablePaging={gridState.showAllRows}
            hidePageSizeSelector={gridState.autoPageSize}
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
            hidePageCount={effectiveFooterConfig.hidePageCount}
            getMessage={getMessage}
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
        getMessage={getMessage}
        ModalComponent={ModalComponent}
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
        getMessage={getMessage}
        ModalComponent={ModalComponent}
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
  const providerConfig = useGridConfig();
  const Components = mergeGridComponents(providerConfig.components, props.components);
  const getMessage = createGridMessageResolver({
    formatMessage: props.formatMessage ?? providerConfig.formatMessage,
    labels: {
      ...(providerConfig.labels ?? {}),
      ...(props.labels ?? {}),
    },
  });
  const ErrorBoundary = TanStackTableErrorBoundary as ComponentType<{
    children?: ReactNode;
    ErrorPanel?: ComponentType<GridErrorPanelProps>;
    getMessage?: ReturnType<typeof createGridMessageResolver>;
    onError?: TanStackGridProps['onError'];
  }>;

  return (
    <ErrorBoundary ErrorPanel={Components.ErrorPanel} getMessage={getMessage} onError={props.onError}>
      <TanStackGridContent {...props} ref={ref} />
    </ErrorBoundary>
  );
});
