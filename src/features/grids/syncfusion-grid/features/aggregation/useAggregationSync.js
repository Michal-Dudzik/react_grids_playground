import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook to handle aggregation bar synchronization with the grid
 * Manages width calculations, scroll synchronization, and responsive updates
 *
 * @param {Object} params - Hook parameters
 * @param {React.RefObject} params.gridRef - Reference to the grid instance
 * @param {React.RefObject} params.aggregationBarRef - Reference to the aggregation bar
 * @param {boolean} params.showAggregates - Whether aggregation bar is visible
 * @param {Array} params.pagedData - Current page data
 * @param {Array} params.processedColumns - Processed grid columns
 * @returns {Object} - { columnWidths, gridContentWidth }
 */
export const useAggregationSync = ({
    gridRef,
    aggregationBarRef,
    showAggregates,
    pagedData,
    processedColumns
}) => {
    const [columnWidths, setColumnWidths] = useState([]);
    const [gridContentWidth, setGridContentWidth] = useState(0);
    const currentWidthsRef = useRef([]);

    // Helper function to calculate column widths from grid
    const calculateColumnWidths = useCallback((gridInstance) => {
        const headerCells = gridInstance.element.querySelectorAll('.e-headercell');
        if (!headerCells.length) return [];

        return Array.from(headerCells).map(cell => cell.offsetWidth);
    }, []);

    // Helper function to update grid content width
    const updateGridContentWidth = useCallback((gridInstance) => {
        const gridScrollable = gridInstance.element.querySelector('.e-content');
        if (gridScrollable) {
            setGridContentWidth(gridScrollable.offsetWidth);
        }
    }, []);

    // Helper function to schedule delayed updates
    const scheduleDelayedUpdates = useCallback((updateFunction, delays) => {
        return delays.map(delay => setTimeout(updateFunction, delay));
    }, []);

    // Track actual column widths from the grid DOM for aggregation bar alignment
    useEffect(() => {
        const gridInstance = gridRef.current;
        if (!showAggregates || !gridInstance || !gridInstance.element) return;

        const updateWidths = () => {
            const widths = calculateColumnWidths(gridInstance);
            if (widths.length > 0) {
                const currentWidths = currentWidthsRef.current;
                if (!(currentWidths.length === widths.length && currentWidths.every((w, i) => w === widths[i]))) {
                    currentWidthsRef.current = widths;
                    setColumnWidths(widths);
                }
            }
            updateGridContentWidth(gridInstance);
        };

        // Try to update widths immediately, then set up observers
        updateWidths();

        // Multiple attempts with increasing delays to catch DOM changes
        const timeouts = scheduleDelayedUpdates(updateWidths, [50, 100, 200, 500]);

        const headerCells = gridInstance.element.querySelectorAll('.e-headercell');
        if (headerCells.length === 0) {
            return () => timeouts.forEach(clearTimeout);
        }

        if (!window.ResizeObserver) {
            return () => timeouts.forEach(clearTimeout);
        }

        const observer = new window.ResizeObserver(updateWidths);
        headerCells.forEach(cell => observer.observe(cell));

        const gridScrollable = gridInstance.element.querySelector('.e-content');
        let gridContentObserver;
        if (gridScrollable && window.ResizeObserver) {
            gridContentObserver = new window.ResizeObserver(updateWidths);
            gridContentObserver.observe(gridScrollable);
        }

        return () => {
            timeouts.forEach(clearTimeout);
            observer.disconnect();
            if (gridContentObserver) gridContentObserver.disconnect();
        };
    }, [pagedData, processedColumns, showAggregates, gridRef, calculateColumnWidths, updateGridContentWidth, scheduleDelayedUpdates]);
    // Additional effect specifically for when aggregation is toggled
    useEffect(() => {
        if (!showAggregates) return;

        const updateAggregationWidths = () => {
            const gridInstance = gridRef.current;
            if (!gridInstance || !gridInstance.element) return;

            const widths = calculateColumnWidths(gridInstance);
            if (widths.length > 0) {
                setColumnWidths(widths);
            }
            updateGridContentWidth(gridInstance);
        };

        // Force immediate width calculation when aggregation is shown
        const timeouts = scheduleDelayedUpdates(updateAggregationWidths, [0, 50, 100, 250]);

        return () => timeouts.forEach(clearTimeout);
    }, [showAggregates, gridRef, calculateColumnWidths, updateGridContentWidth, scheduleDelayedUpdates]);

    // Scroll Sync Effect
    useEffect(() => {
        const gridInstance = gridRef.current;
        if (!gridInstance || !gridInstance.element) return;
        const gridScrollable = gridInstance.element.querySelector('.e-content');
        const aggBar = aggregationBarRef.current;
        if (!gridScrollable || !aggBar) return;

        // Sync initial scroll position
        aggBar.scrollLeft = gridScrollable.scrollLeft;

        const handleGridScroll = () => {
            aggBar.scrollLeft = gridScrollable.scrollLeft;
        };
        gridScrollable.addEventListener('scroll', handleGridScroll);

        return () => {
            gridScrollable.removeEventListener('scroll', handleGridScroll);
        };
    }, [showAggregates, gridRef, aggregationBarRef]);

    return {
        columnWidths,
        gridContentWidth
    };
}; 
