import {useCallback, useEffect, useMemo} from "react";
import {getFooterButtons} from "./features/footer/footerButtons.jsx";

export function useGridSearchProps({
    inputValue,
    setInputValue,
    executeSearch,
    clearSearch,
    isSearching,
    onSearchPropsChange,
}) {
    const searchProps = useMemo(() => ({
        inputValue,
        onInputChange: setInputValue,
        onSearch: executeSearch,
        onClear: clearSearch,
        isSearching,
    }), [inputValue, setInputValue, executeSearch, clearSearch, isSearching]);

    useEffect(() => {
        if (onSearchPropsChange) {
            onSearchPropsChange(searchProps);
        }
    }, [onSearchPropsChange, searchProps]);

    return searchProps;
}

export function useGridEventHandlers({
    gridRef,
    disabledMap,
    onSelectionChange,
    onRowDoubleClick,
    setSelectionCount,
}) {
    const handleContextMenuOpen = useCallback((args) => {
        if (!disabledMap) return;

        const ul = args.element;
        if (!ul) return;

        Object.entries(disabledMap).forEach(([id, isDisabled]) => {
            if (isDisabled) {
                const li = ul.querySelector(`li#${CSS.escape(id)}`);
                if (li && !li.classList.contains('e-disabled')) {
                    li.classList.add('e-disabled');
                }
            }
        });
    }, [disabledMap]);

    const handleRowSelectionChange = useCallback(() => {
        if (!gridRef.current?.getSelectedRecords) {
            return;
        }

        const selectedRecords = gridRef.current.getSelectedRecords();
        if (typeof setSelectionCount === 'function') {
            setSelectionCount(selectedRecords.length);
        }

        if (onSelectionChange) {
            onSelectionChange(selectedRecords);
        }
    }, [gridRef, onSelectionChange, setSelectionCount]);

    const handleRowDoubleClick = useCallback((args) => {
        if (onRowDoubleClick && args.rowData) {
            onRowDoubleClick(args.rowData);
        }
    }, [onRowDoubleClick]);

    return {
        handleContextMenuOpen,
        handleRowSelectionChange,
        handleRowDoubleClick,
    };
}

export function useGridFooterButtons({
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
}) {
    return useMemo(() => getFooterButtons({
        showFilter: true,
        showPrint: footerConfig.showPrint,
        showExportExcel: footerConfig.showExportExcel,
        showColumnsSettings: footerConfig.showColumnsSettings,
        showPresentationSettings: footerConfig.showPresentationSettings,
        filtering,
        setFiltering,
        exportToExcel,
        intl,
        footerButtons: footerConfig.buttons,
        showAggregation: showAggregates,
        onToggleAggregation: () => setShowAggregates(v => !v),
        columns: baseColumns,
        aggregationConfig,
        showApiColumnSettings: shouldFetchColumns && !isLoading && !columnsError,
        onColumnSettingsClick: () => setSettingsModalOpen(true),
        onPresentationSettingsClick: () => setPresentationModalOpen(true),
        columnSettingsActive: settingsModalOpen,
        presentationSettingsActive: presentationModalOpen,
        disableApiColumnSettings: savingColumns,
        apiColumnSettingsLoadingLabel: savingColumns
            ? intl.formatMessage({id: 'txtZapisywanie'}, {defaultMessage: 'Saving...'})
            : undefined,
        printMethods: {
            printAll,
            printCurrentPage,
            printSelected,
        },
        hasSelectedRows: selectionCount > 0,
        selectedRowsCount: selectionCount,
    }), [
        aggregationConfig,
        baseColumns,
        columnsError,
        exportToExcel,
        filtering,
        footerConfig.buttons,
        footerConfig.showColumnsSettings,
        footerConfig.showExportExcel,
        footerConfig.showPresentationSettings,
        footerConfig.showPrint,
        intl,
        isLoading,
        presentationModalOpen,
        printAll,
        printCurrentPage,
        printSelected,
        savingColumns,
        selectionCount,
        setFiltering,
        setPresentationModalOpen,
        setSettingsModalOpen,
        setShowAggregates,
        settingsModalOpen,
        shouldFetchColumns,
        showAggregates,
    ]);
}
