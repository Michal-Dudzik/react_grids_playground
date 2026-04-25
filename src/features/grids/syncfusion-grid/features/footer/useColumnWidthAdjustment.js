import {useEffect, useRef} from 'react';

const FILTER_WIDTH_ADJUSTMENT = 20;
const MIN_COLUMN_WIDTH = 60;

function parseColumnWidth(width) {
    if (typeof width === 'number' && Number.isFinite(width)) {
        return width;
    }

    if (typeof width === 'string') {
        const parsed = parseFloat(width.replace('px', ''));
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

/**
 * Custom hook to automatically adjust column widths when filter visibility changes
 * Adds 20px to all columns when filters are enabled to accommodate filter icons
 * 
 * @param {React.RefObject} gridRef - Reference to the grid instance
 * @param {boolean} filtering - Current filter visibility state
 */
export const useColumnWidthAdjustment = (gridRef, filtering) => {
    const previousFilteringRef = useRef(filtering);

    useEffect(() => {
        const gridInstance = gridRef.current;
        if (!gridInstance || !gridInstance.element || typeof gridInstance.getColumns !== 'function') return;

        // Only adjust if filtering state actually changed (not on initial render)
        const previousFiltering = previousFilteringRef.current;
        if (previousFiltering === filtering) {
            return;
        }

        // Small delay to ensure grid is fully initialized
        const timeoutId = setTimeout(() => {
            try {
                const columns = gridInstance.getColumns();
                if (!columns || !Array.isArray(columns)) return;

                const previousAdjustment = previousFiltering ? FILTER_WIDTH_ADJUSTMENT : 0;
                const nextAdjustment = filtering ? FILTER_WIDTH_ADJUSTMENT : 0;
                let hasChanges = false;

                // Adjust width for each column (except checkbox column)
                columns.forEach((col) => {
                    // Skip checkbox selection column
                    if (col.type === 'checkbox') return;

                    const currentWidth = parseColumnWidth(col.actualWidth ?? col.width ?? col.minWidth ?? 120);
                    if (currentWidth == null) return;

                    const baseWidth = Math.max(currentWidth - previousAdjustment, MIN_COLUMN_WIDTH);
                    const targetWidth = Math.max(baseWidth + nextAdjustment, MIN_COLUMN_WIDTH);

                    if (currentWidth !== targetWidth) {
                        col.width = targetWidth;
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    gridInstance.refreshColumns?.();
                }
            } catch (error) {
                console.warn('Failed to adjust column widths for filtering:', error);
            }
        }, 100);

        // Update the ref for next comparison
        previousFilteringRef.current = filtering;

        return () => clearTimeout(timeoutId);
    }, [gridRef, filtering]);
};
