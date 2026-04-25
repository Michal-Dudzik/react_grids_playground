/**
 * Utility to sync column widths from the Syncfusion grid instance
 * Used to capture current grid column widths after auto-fit or manual resizing
 */

function extractColumnWidth(col) {
    // Prefer actualWidth (computed pixel value) over width (which may have units)
    const width = col.actualWidth || col.width || col.minWidth;
    
    if (!width) return null;
    
    let parsedWidth;
    if (typeof width === 'string') {
        // Only accept numeric strings with optional 'px' suffix
        const match = width.match(/^(\d+(?:\.\d+)?)(px)?$/);
        parsedWidth = match ? parseFloat(match[1]) : NaN;
    } else {
        parsedWidth = width;
    }
    
    return (!isNaN(parsedWidth) && parsedWidth > 0) ? Math.round(parsedWidth) : null;
}
/**
 * Extracts current column widths from a Syncfusion grid instance
 * @param {Object} gridInstance - The Syncfusion grid component instance
 * @returns {Object|null} Map of field names to width values, or null if failed
 */
export function syncGridWidths(gridInstance) {
    if (!gridInstance) {
        console.warn('syncGridWidths: No grid instance provided');
        return null;
    }
    
    try {
        const currentColumns = gridInstance.getColumns();
        
        if (!currentColumns || !Array.isArray(currentColumns)) {
            console.warn('syncGridWidths: Invalid columns array from grid');
            return null;
        }
        
        // Create a map of field -> width
        const widthMap = {};
        
        currentColumns.forEach(col => {
            if (!col.field) return;
            
            const width = extractColumnWidth(col);
            if (width) {
                widthMap[col.field] = width;
            }
        });
        
        return widthMap;
    } catch (error) {
        console.error('syncGridWidths: Error getting current grid widths:', error);
        return null;
    }
}

/**
 * Updates local columns with widths from the grid
 * @param {Array} localColumns - Current local columns state
 * @param {Object} widthMap - Map of field names to widths from syncGridWidths
 * @returns {Array} Updated columns array
 */
export function applyGridWidths(localColumns, widthMap) {
    if (!widthMap || !Array.isArray(localColumns)) {
        return localColumns;
    }
    
    return localColumns.map(col => {
        // Try multiple matching strategies
        const fieldName = col.field || (col.alias?.charAt(0).toLowerCase() + col.alias?.slice(1));
        const newWidth = widthMap[fieldName] || widthMap[col.alias] || widthMap[col.field];
        
        if (newWidth && newWidth !== col.width) {
            return {...col, width: newWidth};
        }
        return col;
    });
}

