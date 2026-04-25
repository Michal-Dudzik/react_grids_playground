import {useCallback, useEffect, useMemo, useRef, useState} from "react";

const DEFAULT_PAGE_SETTINGS = {
    pageSize: 50,
    pageSizes: [20, 50, 100, 150]
};

/**
 * Calculate optimal page size based on available grid height and row height
 * @param {Object} options - Configuration options
 * @param {React.RefObject} options.gridRef - Reference to the grid component
 * @param {React.RefObject} options.containerRef - Reference to the grid container
 * @param {number} options.rowHeight - Height of each row in pixels
 * @param {number} options.headerHeight - Height of the grid header in pixels (default: 40)
 * @param {number} options.footerHeight - Height of the grid footer in pixels (default: 40)
 * @param {number} options.padding - Additional padding to subtract (default: 10)
 * @param {number} options.minPageSize - Minimum page size to return (default: 10)
 * @param {number} options.maxPageSize - Maximum page size to return (default: 200)
 * @returns {number} Optimal page size
 */
export function calculateOptimalPageSize(options = {}) {
    const {
        gridRef,
        containerRef,
        rowHeight,
        headerHeight = 40,
        footerHeight = 40,
        padding = 10, // Reduced padding for more accurate calculation
        minPageSize = 10,
        maxPageSize = 200
    } = options;

    // Try to get container from ref or find it in DOM
    const container = containerRef?.current ||
        (gridRef?.current?.element ? gridRef.current.element.closest('.syncfusion-grid-wrapper') : null);

    if (!container || !rowHeight) {
        return DEFAULT_PAGE_SETTINGS.pageSize;
    }

    try {
        // Get the grid content area (excluding header and footer)
        const gridContent = container.querySelector('.syncfusion-grid-content');
        if (!gridContent) {
            return DEFAULT_PAGE_SETTINGS.pageSize;
        }

        const contentRect = gridContent.getBoundingClientRect();

        // More accurate height calculation - account for actual grid structure
        const availableHeight = contentRect.height - headerHeight - footerHeight - padding;

        // Calculate how many rows can fit, but be more generous to fill space
        const optimalRows = Math.floor(availableHeight / rowHeight);

        // Add a small buffer to fill the space better (allow 1-2 more rows)
        const adjustedRows = Math.max(optimalRows, Math.floor(availableHeight / rowHeight) + 1);

        // Ensure we stay within bounds
        return Math.max(minPageSize, Math.min(maxPageSize, adjustedRows));
    } catch (error) {
        console.warn('Error calculating optimal page size:', error);
        return DEFAULT_PAGE_SETTINGS.pageSize;
    }
}

/**
 * Hook to automatically calculate and update page size based on grid dimensions
 * @param {Object} options - Configuration options
 * @param {React.RefObject} options.gridRef - Reference to the grid component
 * @param {React.RefObject} options.containerRef - Reference to the grid container
 * @param {number} options.rowHeight - Height of each row in pixels
 * @param {boolean} options.autoCalculatePageSize - Whether to auto-calculate page size
 * @param {Function} options.onPageSizeChange - Callback when page size changes
 * @param {number} options.currentPageSize - Current page size to avoid unnecessary updates
 * @returns {Object} Hook result with recalculate function
 */
export function useAutoPageSize(options = {}) {
    const {
        gridRef,
        containerRef,
        rowHeight,
        autoCalculatePageSize = false,
        onPageSizeChange,
        currentPageSize
    } = options;

    const resizeTimeoutRef = useRef(null);
    const initialTimeoutRef = useRef(null);

    const recalculatePageSize = useCallback(() => {
        if (!autoCalculatePageSize || !onPageSizeChange) return;

        const optimalPageSize = calculateOptimalPageSize({
            gridRef,
            containerRef,
            rowHeight
        });

        // Only update if the calculated size is different and within reasonable bounds
        if (optimalPageSize !== currentPageSize && optimalPageSize >= 10 && optimalPageSize <= 200) {
            onPageSizeChange(optimalPageSize);
        }
    }, [autoCalculatePageSize, onPageSizeChange, gridRef, containerRef, rowHeight, currentPageSize]);

    useEffect(() => {
        if (!autoCalculatePageSize) return;

        // Calculate on mount
        recalculatePageSize();

        // Recalculate on window resize
        const handleResize = () => {
            // Clear previous timeout before setting a new one
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            // Debounce resize events
            resizeTimeoutRef.current = setTimeout(recalculatePageSize, 100);
        };

        window.addEventListener('resize', handleResize);

        // Recalculate after a short delay to ensure DOM is ready
        initialTimeoutRef.current = setTimeout(recalculatePageSize, 200);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Clear both timeouts if they exist
            if (initialTimeoutRef.current) {
                clearTimeout(initialTimeoutRef.current);
                initialTimeoutRef.current = null;
            }
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
                resizeTimeoutRef.current = null;
            }
        };
    }, [autoCalculatePageSize, recalculatePageSize]);

    return {recalculatePageSize};
}

export function useGridPaging(filteredData, pageSettings = {}, disablePaging = false, autoPageSizeOptions = {}) {
    const mergedSettings = {
        ...DEFAULT_PAGE_SETTINGS,
        ...pageSettings
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(mergedSettings.pageSize);
    const [calculatedPageSize, setCalculatedPageSize] = useState(null);
    const [hasManualSelection, setHasManualSelection] = useState(false);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when page size changes
        setHasManualSelection(true); // Mark as manually selected
    };

    // Auto page size calculation with state tracking
    const {recalculatePageSize} = useAutoPageSize({
        ...autoPageSizeOptions,
        currentPageSize: pageSize,
        onPageSizeChange: (calculatedSize) => {
            setCalculatedPageSize(calculatedSize);
            // Only apply auto-calculated size if user hasn't manually selected one
            if (!hasManualSelection) {
                setPageSize(calculatedSize);
                setCurrentPage(1);
            }
        }
    });

    // Dynamic page size options that include calculated and current page sizes
    const pageSizeOptions = useMemo(() => {
        const baseOptions = [...mergedSettings.pageSizes];

        // Add calculated page size if it exists and auto calculation is enabled
        if (calculatedPageSize && autoPageSizeOptions.autoCalculatePageSize) {
            baseOptions.push(calculatedPageSize);
        }

        // Add current page size if it's not already in the list
        if (!baseOptions.includes(pageSize)) {
            baseOptions.push(pageSize);
        }

        // Remove duplicates and sort
        const uniqueOptions = [...new Set(baseOptions)];
        return uniqueOptions.sort((a, b) => a - b);
    }, [mergedSettings.pageSizes, calculatedPageSize, pageSize, autoPageSizeOptions.autoCalculatePageSize]);

    const pagedData = useMemo(() => {
        // If paging is disabled, return all filtered data
        if (disablePaging) {
            return filteredData;
        }

        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        return filteredData.slice(startIdx, endIdx);
    }, [filteredData, currentPage, pageSize, disablePaging]);

    useEffect(() => {
        if (disablePaging) {
            return;
        }

        const maxPage = Math.max(1, Math.ceil(filteredData.length / pageSize));
        if (currentPage > maxPage) {
            setCurrentPage(1);
        }
    }, [currentPage, disablePaging, filteredData.length, pageSize]);

    // Function to reset to auto-calculated page size
    const resetToAutoPageSize = useCallback(() => {
        setHasManualSelection(false);
        if (calculatedPageSize) {
            setPageSize(calculatedPageSize);
            setCurrentPage(1);
        }
    }, [calculatedPageSize]);

    return {
        currentPage,
        pageSize,
        pageSizeOptions,
        handlePageChange,
        handlePageSizeChange,
        pagedData,
        recalculatePageSize,
        resetToAutoPageSize,
        hasManualSelection,
        calculatedPageSize,
    };
} 
