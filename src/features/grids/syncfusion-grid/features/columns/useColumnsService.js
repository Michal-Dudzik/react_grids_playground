import {useState, useCallback, useEffect, useRef} from 'react';
import apiClient from "../../../../../api/apiClient.js";
import {useIntl} from 'react-intl';
import {showErrorToast} from "../../../error-toast/showErrorToast.jsx";

export const useColumnsService = (options = {}) => {
    const {
        appId,
        gridId,
        autoLoad = true,
        defaultColumns = [],
    } = options;

    const intl = useIntl();
    const currentLocale = intl.locale || 'pl';

    // State management
    const [columns, setColumns] = useState(defaultColumns);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [loaded, setLoaded] = useState(false);

    // Stable reference for options and request deduplication
    const optionsRef = useRef({defaultColumns});
    const activeRequestRef = useRef(null);
    const previousLocaleRef = useRef(currentLocale);

    useEffect(() => {
        optionsRef.current = {defaultColumns};
    }, [defaultColumns]);

    // Main fetch function with request deduplication
    const fetchColumns = useCallback(async (params = {}) => {
        // Early return if missing required params
        if (!appId || !gridId) {
            console.warn('useColumnsService: Missing required parameters - appId and gridId');
            return optionsRef.current.defaultColumns;
        }

        // Request deduplication - if same request is in progress, return the existing promise
        const requestKey = `${appId}-${gridId}-${params.language || currentLocale}`;
        if (activeRequestRef.current?.key === requestKey) {
            return activeRequestRef.current.promise;
        }

        setIsLoading(true);
        setError(null);

        const requestPromise = (async () => {
            try {
                const language = params.language || currentLocale;
                const endpoint = `/api/SysUserInfo/gridColumnsByUser?appId=${appId}&gridId=${gridId}&languageCode=${language}`;

                const columnsData = await apiClient.get(endpoint, {
                    cache: true,
                    cacheTTL: 5 * 60 * 1000, // 5 minutes cache for columns
                    silent: params.silent || false,
                    retries: 2, // Retry failed requests up to 2 times
                });

                // Validate response structure
                if (!columnsData) {
                    throw new Error('No data received from columns API');
                }

                // Extract columns array from various possible response structures
                const columnsArray = Array.isArray(columnsData)
                    ? columnsData
                    : (columnsData.columns || columnsData.data || []);

                if (!Array.isArray(columnsArray)) {
                    throw new Error('Invalid columns data structure - expected array');
                }

                setColumns(columnsArray);
                setLoaded(true);
                return columnsArray;

            } catch (error) {
                console.error('useColumnsService: Failed to fetch columns', error);
                setError(error);

                // Fallback to default columns
                const fallbackColumns = optionsRef.current.defaultColumns;
                setColumns(fallbackColumns);

                // Show user-friendly error (only if not request deduplication)
                if (!params.silent) {
                    // Handle ApiError with multiple messages
                    if (error.name === 'ApiError' && error.messages) {
                        error.messages.forEach(message => {
                            showErrorToast({
                                title: intl.formatMessage({
                                    id: 'txtBladLadowaniaKolumn',
                                    defaultMessage: 'Error loading columns'
                                }),
                                error: {message},
                                location: "useColumnsService: fetchColumns"
                            });
                        });
                    } else {
                        showErrorToast({
                            title: intl.formatMessage({
                                id: 'txtBladLadowaniaKolumn',
                                defaultMessage: 'Error loading columns'
                            }),
                            error: error,
                            location: "useColumnsService: fetchColumns"
                        });
                    }
                }

                return fallbackColumns;
            } finally {
                setLoaded(true);
                setIsLoading(false);
                activeRequestRef.current = null;
            }
        })();

        // Store active request for deduplication
        activeRequestRef.current = {
            key: requestKey,
            promise: requestPromise
        };

        return requestPromise;
    }, [appId, gridId, currentLocale, intl]);

    // Update columns function with optimistic error handling
    const updateColumns = useCallback(async (changedColumns) => {
        // Validate required parameters
        if (!appId || !gridId) {
            throw new Error('useColumnsService: appId and gridId are required for update');
        }

        if (!Array.isArray(changedColumns)) {
            throw new Error('useColumnsService: changedColumns must be an array');
        }

        if (changedColumns.length === 0) {
            console.warn('useColumnsService: No columns to update');
            return {success: true, message: 'No changes to save'};
        }

        setIsSaving(true);
        setError(null);

        try {
            const endpoint = `/api/SysUserInfo/gridColumnsByUser?appId=${appId}&gridId=${gridId}`;
            const response = await apiClient.put(endpoint, changedColumns, {
                timeout: 15000, // 15 second timeout for updates
                retries: 1, // Single retry for updates
            });

            // Clear cache after successful update
            clearColumnsCache();

            return response;
        } catch (error) {
            // Add context to error for better debugging
            error.context = {
                appId,
                gridId,
                columnCount: changedColumns.length,
                operation: 'updateColumns'
            };

            setError(error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [appId, gridId]);

    // Delete/reset columns function with better error context
    const deleteColumns = useCallback(async () => {
        if (!appId || !gridId) {
            throw new Error('useColumnsService: appId and gridId are required for delete');
        }

        setIsDeleting(true);
        setError(null);

        try {
            const endpoint = `/api/SysUserInfo/gridColumnsByUser?appId=${appId}&gridId=${gridId}`;
            const response = await apiClient.delete(endpoint, {
                timeout: 10000, // 10 second timeout for deletes
                retries: 1, // Single retry for deletes
            });

            // Clear cache after successful delete
            clearColumnsCache();

            return response;
        } catch (error) {
            error.context = {
                appId,
                gridId,
                operation: 'deleteColumns'
            };

            setError(error);
            throw error;
        } finally {
            setIsDeleting(false);
        }
    }, [appId, gridId]);

    // Store fetchColumns in ref to avoid dependency issues
    const fetchColumnsRef = useRef(fetchColumns);
    fetchColumnsRef.current = fetchColumns;

    // Auto-load effect with better dependency management
    useEffect(() => {
        if (autoLoad && appId && gridId && !loaded && !isLoading) {
            fetchColumnsRef.current();
        }
    }, [autoLoad, appId, gridId, loaded, isLoading, currentLocale]);

    // Reset state when key parameters change
    useEffect(() => {
        setColumns(optionsRef.current.defaultColumns);
        setLoaded(false);
        setError(null);
        // Clear any active requests when parameters change
        activeRequestRef.current = null;
    }, [appId, gridId]);

    useEffect(() => {
        if (previousLocaleRef.current === currentLocale) {
            return;
        }

        previousLocaleRef.current = currentLocale;
        setColumns(optionsRef.current.defaultColumns);
        setLoaded(false);
        setError(null);
        activeRequestRef.current = null;
    }, [currentLocale]);

    // Reset columns function
    const resetColumns = useCallback(() => {
        setColumns(optionsRef.current.defaultColumns);
        setLoaded(false);
        setError(null);
        activeRequestRef.current = null;
    }, []);

    // Clear cache for this grid's columns
    const clearColumnsCache = useCallback(() => {
        if (appId && gridId) {
            // Clear cache entries that match this grid's pattern
            apiClient.clearCache(`gridColumnsByUser?appId=${appId}&gridId=${gridId}`);
        }
    }, [appId, gridId]);

    return {
        // Data
        columns,

        // Loading states
        isLoading,
        isSaving,
        isDeleting,
        isWorking: isLoading || isSaving || isDeleting,

        // Error state
        error,

        // Functions
        fetchColumns,
        updateColumns,
        deleteColumns,
        setColumns,
        resetColumns,
        clearColumnsCache,

        // Status
        loaded,
    };
};

export default useColumnsService;
