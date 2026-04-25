import {useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect, useMemo} from "react";
import {useIntl} from "react-intl";

import GridBase from "./GridBase.jsx";
import CustomGridFooter from "./features/footer/CustomGridFooter.jsx";
import AggregationBar from "./features/aggregation/AggregationBar.jsx";
import ColumnSettingsModal from "./features/columns/ColumnSettingsModal.jsx";
import GridPresentationModal from "./features/presentation/GridPresentationModal.jsx";
import GridErrorBoundary from "./GridErrorBoundary.jsx";

import {useGridExport} from "./features/exportExcel/useGridExport.jsx";
import {useGridSearch} from "./features/search/useGridSearch.jsx";
import {useGridPaging} from "./features/paging/useGridPaging.js";
import {useGridColumns} from "./features/columns/useGridColumns.js";
import {useLoading} from "./features/loading/useLoading.jsx";
import {usePrintGrid} from "./features/print/usePrintGrid.jsx";

import {useAggregationSync} from "./features/aggregation/useAggregationSync.js";
import {useFilterState} from "./features/footer/useFilterState.js";
import {useColumnWidthAdjustment} from "./features/footer/useColumnWidthAdjustment.js";
import {syncGridWidths} from "./features/columns/syncGridWidths.js";
import {
    buildFallbackFilterScope,
    buildFilterStorageKey,
    buildPresentationStorageKey,
} from "./syncfusionGridHelpers.js";
import {
    useGridEventHandlers,
    useGridFooterButtons,
    useGridSearchProps,
} from "./syncfusionGridHooks.js";
import {useSyncfusionGridPresentation} from "./syncfusionGridPresentation.js";
import {
    loadPresentationConfig,
    resetPresentationConfig,
    savePresentationConfig,
} from "./features/presentation/presentationStorage.js";

const SyncfusionGrid = forwardRef((props, ref) => {
    const {
        data,
        allowSorting = true,
        allowFiltering = true,
        enableSelectionColumn = false,
        allowEditing = false,
        editSettings = {},
        pageSettings,
        footerConfig = {
            showFooter: true,
            showPrint: true,
            showExportExcel: true,
            showColumnsSettings: false,
            showPresentationSettings: false,
            hidePageCount: false,
            buttons: []
        },
        searchFields = [],
        decoration = {},
        aggregationConfig,
        presentationConfig: presentationDefaults = undefined,
        appId,
        gridId,
        columns = [],
        transformColumnsFn,
        contextMenu = {},
        templateRules = undefined,
        selectionSettings: selectionSettingsProp = undefined,
        loading = false,
        onSelectionChange,
        onRowDoubleClick,
        onSearchPropsChange,
        lowRowHeight = false,
        rowHeight: rowHeightProp = undefined,
        disablePaging = false,
        autoCalculatePageSize = false,
        ...restProps
    } = props;

    // ==================== DERIVED STATE ====================
    const shouldFetchColumns = !!(appId && gridId);
    const fallbackFilterScope = useMemo(() => buildFallbackFilterScope(columns), [columns]);

    // ==================== REFS & HOOKS ====================
    const intl = useIntl();
    const gridWrapperRef = useRef(null);
    const gridRef = useRef(null);
    const aggregationBarRef = useRef(null);

    // ==================== LOCAL STATE ====================
    // Generate unique storage key for this grid's filter state
    const filterStorageKey = useMemo(() => buildFilterStorageKey({
        appId,
        gridId,
        fallbackFilterScope,
    }), [appId, fallbackFilterScope, gridId]);
    const presentationStorageKey = useMemo(() => buildPresentationStorageKey({
        appId,
        gridId,
        fallbackFilterScope,
    }), [appId, fallbackFilterScope, gridId]);

    const [filtering, setFiltering] = useFilterState(filterStorageKey, allowFiltering);
    const [showAggregates, setShowAggregates] = useState(false);
    const [selectionCount, setSelectionCount] = useState(0);
    const [presentationModalOpen, setPresentationModalOpen] = useState(false);
    const [presentationConfig, setPresentationConfig] = useState(() => (
        loadPresentationConfig(presentationStorageKey, presentationDefaults)
    ));

    // ==================== API HOOKS ====================
    const {
        columns: baseColumns,
        columnsState,
        error: columnsError,
        settingsModalOpen,
        setSettingsModalOpen,
        saveColumns,
        savingColumns,
        resetColumns,
        isReadyToRender,
    } = useGridColumns({
        fetchColumns: shouldFetchColumns,
        appId,
        gridId,
        defaultColumns: columns,
        transformColumnsFn,
    });

    // ==================== LOADING MANAGEMENT ====================
    // Grid should be loading until BOTH data and columns are ready
    const isLoading = loading || !isReadyToRender;
    const {LoadingComponent} = useLoading(isLoading);

    useEffect(() => {
        setPresentationConfig(loadPresentationConfig(presentationStorageKey, presentationDefaults));
    }, [presentationStorageKey, presentationDefaults]);

    // ==================== FEATURE HOOKS ====================
    const {exportToExcel, ExportLoadingModal} = useGridExport(gridRef, data);
    const {
        filteredData,
        executeSearch,
        inputValue,
        setInputValue,
        appliedSearchTerm,
        isSearching,
        clearSearch
    } = useGridSearch(data, searchFields);

    // Calculate row height based on lowRowHeight prop
    const rowHeight = typeof rowHeightProp === "number" && rowHeightProp > 0
        ? rowHeightProp
        : (lowRowHeight ? 32 : 42);

    const {
        currentPage,
        pageSize,
        pageSizeOptions,
        handlePageChange,
        handlePageSizeChange,
        pagedData,
        recalculatePageSize,
    } = useGridPaging(filteredData, pageSettings, disablePaging, {
        gridRef,
        containerRef: gridWrapperRef,
        rowHeight,
        autoCalculatePageSize,
    });

    // Print functionality hook - will be initialized after finalColumns are ready

    // Column width adjustment when filters are toggled
    useColumnWidthAdjustment(gridRef, filtering);

    const {
        queryCellInfo,
        rowDataBound,
        columnHeaderBound,
        selectionSettings,
        finalColumns,
        gridKey,
        mergedContextMenuItems,
        customAggregates,
    } = useSyncfusionGridPresentation({
        baseColumns,
        decoration,
        appliedSearchTerm,
        searchFields,
        templateRules,
        presentationConfig,
        enableSelectionColumn,
        selectionSettingsProp,
        contextMenuItems: contextMenu.contextMenuItems,
        showAggregates,
        pagedData,
        filteredData,
        aggregationConfig,
    });

    // ==================== AGGREGATION SYNC ====================
    const {columnWidths, gridContentWidth} = useAggregationSync({
        gridRef,
        aggregationBarRef,
        showAggregates,
        pagedData,
        processedColumns: finalColumns
    });

    // Print functionality hook - now using processed columns with templates and actual column widths
    const {
        printAll,
        printCurrentPage,
        printSelected,
        getSelectedRowsCount,
        hasSelectedRows
    } = usePrintGrid(gridRef, finalColumns, data, pagedData, columnWidths);

    // ==================== IMPERATIVE HANDLE ====================
    useImperativeHandle(ref, () => ({
        getGridInstance: () => gridRef.current,
        getSelectedRows: () => gridRef.current?.getSelectedRecords?.() || [],
        getColumns: () => baseColumns || [],
        printAll: () => printAll(),
        printCurrentPage: () => printCurrentPage(),
        printSelected: () => printSelected(),
        getSelectedRowsCount: () => getSelectedRowsCount(),
        hasSelectedRows: () => hasSelectedRows(),
    }), [gridRef, baseColumns, printAll, printCurrentPage, printSelected, getSelectedRowsCount, hasSelectedRows]);

    const handleSavePresentationConfig = useCallback((nextConfig) => {
        const savedConfig = savePresentationConfig(presentationStorageKey, nextConfig);
        setPresentationConfig(savedConfig);
        setPresentationModalOpen(false);
    }, [presentationStorageKey]);

    const handleResetPresentationConfig = useCallback(() => {
        const resetConfig = resetPresentationConfig(presentationStorageKey, presentationDefaults);
        setPresentationConfig(resetConfig);
        setPresentationModalOpen(false);
    }, [presentationDefaults, presentationStorageKey]);

    const mergedFooterButtons = useGridFooterButtons({
        footerConfig,
        filtering,
        setFiltering,
        exportToExcel,
        intl,
        showAggregates,
        setShowAggregates,
        baseColumns,
        aggregationConfig,
        shouldFetchColumns,
        isLoading,
        columnsError,
        setSettingsModalOpen,
        presentationModalOpen,
        setPresentationModalOpen,
        settingsModalOpen,
        savingColumns,
        printAll,
        printCurrentPage,
        printSelected,
        selectionCount,
    });

    const searchProps = useGridSearchProps({
        inputValue,
        setInputValue,
        executeSearch,
        clearSearch,
        isSearching,
        onSearchPropsChange,
    });

    const {
        handleContextMenuOpen,
        handleRowSelectionChange,
        handleRowDoubleClick,
    } = useGridEventHandlers({
        gridRef,
        disabledMap: contextMenu?.disabledMap,
        onSelectionChange,
        onRowDoubleClick,
        setSelectionCount,
    });

    // ==================== EFFECTS ====================

    // Recalculate page size when grid is ready or data changes
    useEffect(() => {
        if (autoCalculatePageSize && !isLoading && gridRef.current) {
            // Delay to ensure grid is fully rendered
            const timeoutId = setTimeout(() => {
                recalculatePageSize();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [autoCalculatePageSize, isLoading, recalculatePageSize, gridKey, data?.length]);

    // ==================== RENDER ====================
    return (
        <GridErrorBoundary>
            <div ref={gridWrapperRef} className="syncfusion-grid-wrapper">
                <div className="syncfusion-grid-flex">
                    <div className="syncfusion-grid-content">
                        {LoadingComponent}
                        {!isLoading && (
                            <GridBase
                                key={gridKey}
                                ref={gridRef}
                                data={pagedData}
                                columns={finalColumns}
                                enableSelectionColumn={enableSelectionColumn}
                                allowSorting={allowSorting}
                                allowFiltering={filtering}
                                allowSelection={true}
                                contextMenuItems={mergedContextMenuItems}
                                contextMenuClick={contextMenu.onContextMenuClick}
                                contextMenuOpen={handleContextMenuOpen}
                                queryCellInfo={queryCellInfo}
                                headerCellInfo={columnHeaderBound}
                                rowDataBound={rowDataBound}
                                selectionSettings={selectionSettings}
                                rowSelected={handleRowSelectionChange}
                                rowDeselected={handleRowSelectionChange}
                                recordDoubleClick={handleRowDoubleClick}
                                rowHeight={rowHeight}
                                allowEditing={allowEditing}
                                editSettings={editSettings}
                                {...restProps}
                            />
                        )}
                    </div>
                    {showAggregates && (
                        <div className="syncfusion-aggregation-container">
                            <AggregationBar
                                ref={aggregationBarRef}
                                columns={baseColumns}
                                aggregates={customAggregates}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                total={filteredData.length}
                                columnWidths={columnWidths}
                                gridContentWidth={gridContentWidth}
                                minWidth={columnWidths.reduce((a, b) => a + b, 0)}
                            />
                        </div>
                    )}
                </div>
                {footerConfig.showFooter && (
                    <CustomGridFooter
                        currentPage={currentPage}
                        pageSize={pageSize}
                        total={filteredData.length}
                        pageSizeOptions={pageSizeOptions}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        SearchComponent={searchProps}
                        buttons={mergedFooterButtons}
                        hidePageCount={footerConfig.hidePageCount}
                        disablePaging={disablePaging}
                    />
                )}
                <ExportLoadingModal/>

                <ColumnSettingsModal
                    open={settingsModalOpen}
                    onClose={() => setSettingsModalOpen(false)}
                    columns={columnsState}
                    onSave={saveColumns}
                    isLoading={savingColumns}
                    onReset={resetColumns}
                    onSyncWithGrid={() => syncGridWidths(gridRef.current)}
                />

                <GridPresentationModal
                    open={presentationModalOpen}
                    onClose={() => setPresentationModalOpen(false)}
                    columns={baseColumns}
                    value={presentationConfig}
                    onSave={handleSavePresentationConfig}
                    onReset={handleResetPresentationConfig}
                />
            </div>
        </GridErrorBoundary>
    );
});

SyncfusionGrid.displayName = 'SyncfusionGrid';

export default SyncfusionGrid; 
