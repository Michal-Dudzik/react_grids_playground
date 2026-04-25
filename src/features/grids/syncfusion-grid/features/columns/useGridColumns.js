import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useColumnsService} from "./useColumnsService.js";
import mapApiColumns, {standardizeColumns} from "./mapApiColumns.js";
import {toast} from 'react-hot-toast';
import {useIntl} from 'react-intl';
import {showErrorToast} from "../../../error-toast/showErrorToast.jsx";

const EMPTY_LOCAL_OVERRIDE = null;

export function useGridColumns({
                                   fetchColumns,
                                   appId,
                                   gridId,
                                   defaultColumns = [],
                                   transformColumnsFn,
                               }) {
    const intl = useIntl();

    // Modal state
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [localColumnsOverride, setLocalColumnsOverride] = useState(EMPTY_LOCAL_OVERRIDE);

    // Use the merged columns API hook
    const columnsApi = useColumnsService({
        appId: fetchColumns ? appId : undefined,
        gridId: fetchColumns ? gridId : undefined,
        autoLoad: fetchColumns && Boolean(appId && gridId),
        defaultColumns
    });

    // Store refs for stable access to changing values
    const transformColumnsFnRef = useRef(transformColumnsFn);
    const defaultColumnsRef = useRef(defaultColumns);
    const defaultColumnsSignatureRef = useRef('');

    useEffect(() => {
        transformColumnsFnRef.current = transformColumnsFn;
        defaultColumnsRef.current = defaultColumns;
    });

    useEffect(() => {
        if (fetchColumns) {
            setLocalColumnsOverride(EMPTY_LOCAL_OVERRIDE);
            defaultColumnsSignatureRef.current = '';
            return;
        }

        const nextSignature = JSON.stringify(
            (defaultColumns || []).map((col, index) => ({
                key: col?.colNo ?? col?.field ?? col?.alias ?? `col-${index}`,
                width: col?.width ?? null,
                visible: col?.visible ?? true,
                orderID: col?.orderID ?? null,
                headerText: col?.headerText ?? col?.description ?? null,
            }))
        );

        if (defaultColumnsSignatureRef.current !== nextSignature) {
            defaultColumnsSignatureRef.current = nextSignature;
            setLocalColumnsOverride(EMPTY_LOCAL_OVERRIDE);
        }
    }, [defaultColumns, fetchColumns]);

    // Process columns into final grid columns - fully unified processing
    const processedColumns = useMemo(() => {
        let sourceColumns;

        if (!fetchColumns) {
            // Using parent-provided columns
            sourceColumns = localColumnsOverride ?? defaultColumns;
        } else {
            // Using API columns
            if ((!Array.isArray(columnsApi.columns) || columnsApi.columns.length === 0) && columnsApi.isLoading) {
                // Still loading API data, use defaultColumns as fallback to prevent blinking
                sourceColumns = defaultColumns;
            } else if (Array.isArray(columnsApi.columns) && columnsApi.columns.length > 0) {
                // Have API data
                sourceColumns = columnsApi.columns;
            } else {
                // API failed or no data, fallback to defaultColumns
                sourceColumns = defaultColumns;
            }
        }

        // Universal processing pipeline for ALL columns (no exceptions!)
        try {
            // Step 1: ALL columns go through standardization (API columns too!)
            const standardizedColumns = standardizeColumns(sourceColumns);

            // Step 2: Map standardized columns to Syncfusion format (with translation)
            const mappedColumns = mapApiColumns(standardizedColumns, intl);

            // Step 3: Apply custom transformation if provided
            const transformedColumns = transformColumnsFnRef.current
                ? transformColumnsFnRef.current(mappedColumns, intl)
                : mappedColumns;

            // Step 4: Sort by orderID for consistent display
            return [...transformedColumns].sort((a, b) => (a.orderID || 0) - (b.orderID || 0));

        } catch (error) {
            console.error('Failed to process columns:', error);
            // Fallback to original columns without processing
            return Array.isArray(sourceColumns) ? sourceColumns : defaultColumnsRef.current;
        }
    }, [fetchColumns, columnsApi.columns, columnsApi.isLoading, defaultColumns, intl, localColumnsOverride]);

    // Memoized visible columns for rendering
    const visibleColumns = useMemo(() => {
        if (!Array.isArray(processedColumns)) return [];

        return fetchColumns
            ? processedColumns.filter(col => col.visible !== false)
            : [...processedColumns];
    }, [fetchColumns, processedColumns]);

    // Enhanced save columns with automatic refresh and better error handling
    const saveColumns = useCallback(async (changedColumns) => {
        if (!Array.isArray(changedColumns)) {
            console.warn('saveColumns: changedColumns must be an array');
            return;
        }

        if (!fetchColumns) {
            setLocalColumnsOverride(changedColumns);
            setSettingsModalOpen(false);
            toast.success(intl.formatMessage({
                id: 'txtKolumnyZapisane',
                defaultMessage: 'Columns saved successfully!'
            }));
            return;
        }

        if (!appId || !gridId) {
            console.warn('saveColumns: Missing appId or gridId');
            return;
        }

        try {
            await columnsApi.updateColumns(changedColumns);

            // Automatically refresh columns after save
            await columnsApi.fetchColumns();

            setSettingsModalOpen(false);
            toast.success(intl.formatMessage({
                id: 'txtKolumnyZapisane',
                defaultMessage: 'Columns saved successfully!'
            }));
        } catch (error) {
            showErrorToast({
                title: intl.formatMessage({
                    id: 'txtBladZapisuKolumn',
                    defaultMessage: 'Error saving columns'
                }),
                error,
                location: 'useGridColumns.saveColumns'
            });
        }
    }, [appId, fetchColumns, gridId, intl, columnsApi.updateColumns, columnsApi.fetchColumns]);

    // Enhanced reset columns with automatic refresh and better error handling
    const resetColumns = useCallback(async () => {
        if (!fetchColumns) {
            setLocalColumnsOverride(EMPTY_LOCAL_OVERRIDE);
            setSettingsModalOpen(false);
            toast.success(intl.formatMessage({
                id: 'txtKolumnyPrzywrocone',
                defaultMessage: 'Columns reset to default!'
            }));
            return;
        }

        if (!appId || !gridId) {
            console.warn('resetColumns: Missing appId or gridId');
            return;
        }

        try {
            await columnsApi.deleteColumns();

            // Automatically refresh columns after reset
            await columnsApi.fetchColumns();

            toast.success(intl.formatMessage({
                id: 'txtKolumnyPrzywrocone',
                defaultMessage: 'Columns reset to default!'
            }));
        } catch (error) {
            showErrorToast({
                title: intl.formatMessage({
                    id: 'txtBladPrzywracaniaKolumn',
                    defaultMessage: 'Error resetting columns'
                }),
                error,
                location: 'useGridColumns.resetColumns'
            });
        }
    }, [appId, fetchColumns, gridId, intl, columnsApi.deleteColumns, columnsApi.fetchColumns]);

    // Refresh columns function for external use
    const refreshColumns = useCallback(async () => {
        if (!fetchColumns || !appId || !gridId) {
            console.warn('refreshColumns: Not configured for API fetching or missing parameters');
            return;
        }

        try {
            await columnsApi.fetchColumns();
        } catch (error) {
            console.error('Failed to refresh columns:', error);
        }
    }, [fetchColumns, appId, gridId, columnsApi.fetchColumns]);

    // Determine if we're ready to show the grid (prevents initial flash)
    const isReadyToRender = useMemo(() => {
        if (!fetchColumns) {
            // If not fetching from API, we're ready if we have defaultColumns
            return Array.isArray(defaultColumns) && defaultColumns.length > 0;
        }

        // If fetching from API, we're ready when:
        // 1. We have API data loaded successfully, OR
        // 2. We're not loading anymore and have defaultColumns as fallback, OR
        // 3. The request completed (including empty/error responses) so we can render
        const hasApiData = Array.isArray(columnsApi.columns) && columnsApi.columns.length > 0;
        const notLoadingWithFallback = !columnsApi.isLoading && Array.isArray(defaultColumns) && defaultColumns.length > 0;
        const requestCompleted = !columnsApi.isLoading && columnsApi.loaded;

        return hasApiData || notLoadingWithFallback || requestCompleted;
    }, [fetchColumns, columnsApi.isLoading, columnsApi.columns, columnsApi.loaded, defaultColumns]);

    // Calculate actual loading state - we're loading if fetching columns and not ready to render
    const isActuallyLoading = fetchColumns && !isReadyToRender;

    return {
        // Columns data
        columns: visibleColumns,
        columnsState: processedColumns, // All columns including hidden ones

        // Loading states - simplified with isReadyToRender handling column loading
        loading: isActuallyLoading,
        savingColumns: columnsApi.isSaving,
        isWorking: columnsApi.isWorking,

        // Ready state to prevent initial flash
        isReadyToRender,

        // Error state
        error: fetchColumns ? columnsApi.error : null,

        // Modal state
        settingsModalOpen,
        setSettingsModalOpen,

        // Actions - clean and focused
        saveColumns,
        resetColumns,
        refreshColumns,

        // Legacy compatibility (for existing features that might need this)
        setColumnsState: () => {
            console.warn('setColumnsState is deprecated - columns are now managed automatically');
        },
    };
} 
