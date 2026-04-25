/**
 * Complete column processing utilities for syncfusion-grid.
 * Handles transformation of parent columns to API format and mapping to Syncfusion format.
 */

/**
 * Maps standardized columns to syncfusion-grid format.
 * All columns (API or parent) are expected to be in the standard API format.
 *
 * Standard column fields mapped:
 * - alias -> field
 * - description -> headerText
 * - width -> width
 * - readOnly -> allowEditing (inverted)
 * - alignment -> textAlign ("L"|"M"|"R" to "Left"|"Center"|"Right")
 * - format -> format
 * - visible -> visible
 * - allowColFiltering -> allowFiltering
 * - allowColSorting -> allowSorting
 * - isPrimaryKey -> isPrimaryKey
 * - colType -> type
 * - colTemplate -> template (if provided)
 * - colCustomAttributes -> customAttributes (if provided)
 * - orderID -> orderID
 *
 * @param {Array} standardizedColumns - Array of columns in standard API format
 * @returns {Array} syncfusion-grid columns
 */

// Pre-defined mapping objects for better performance
const ALIGNMENT_MAP = {
    'L': 'Left',
    'M': 'Center',
    'R': 'Right'
};


// Optimized camelCase conversion
const toCamelCase = (str) => {
    if (!str) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Transforms a single parent column to API format
 */
const transformToApiFormat = (col, idx) => {
    if (!col || typeof col !== 'object') {
        console.warn(`standardizeColumns: Invalid column object at index ${idx}:`, col);
        return null;
    }

    // Special handling for checkbox columns
    if (col.type === 'checkbox') {
        return {
            alias: undefined, // Checkbox columns don't need alias
            description: col.headerText || '',
            width: col.width || 40,
            visible: col.visible !== undefined ? col.visible : true,
            allowColFiltering: false,
            allowColSorting: false,
            colType: 'checkbox',
            orderID: typeof col.orderID === 'number' ? col.orderID : idx + 1,
            // Preserve all other properties
            ...col,
            // Override with standardized properties
            readOnly: col.readOnly !== undefined ? col.readOnly : true,
            alignment: col.alignment,
            colTemplate: col.template,
            colCustomAttributes: col.customAttributes,
        };
    }

    // Handle both API columns and parent columns intelligently
    return {
        // Core API properties
        alias: col.alias || col.field,
        description: col.description || col.headerText || col.headerTextId || col.field || 'Column',
        width: col.width,
        visible: col.visible,
        // allowColFiltering: col.allowColFiltering !== undefined ? col.allowColFiltering : col.allowFiltering,
        // allowColSorting: col.allowColSorting !== undefined ? col.allowColSorting : col.allowSorting,
        isPrimaryKey: col.isPrimaryKey,
        colType: col.colType || col.type,
        format: col.format,
        orderID: typeof col.orderID === 'number' ? col.orderID : idx + 1,

        // Transform Syncfusion properties to API format if not already present
        readOnly: col.readOnly !== undefined
            ? col.readOnly
            : (col.allowEditing !== undefined ? !col.allowEditing : undefined),
        alignment: col.alignment,
        colTemplate: col.colTemplate || col.template,
        colCustomAttributes: col.colCustomAttributes || col.customAttributes,

        // Preserve original translation key for later use
        _originalHeaderTextId: col.headerTextId,

        // Preserve all other properties that don't conflict
        ...Object.fromEntries(
            Object.entries(col).filter(([key]) => ![
                'field', 'headerText', 'headerTextId', 'allowEditing',
                'type', 'template', 'customAttributes',
                'alias', 'description', 'allowColFiltering', 'allowColSorting',
                'colType', 'readOnly', 'alignment', 'colTemplate', 'colCustomAttributes',
                '_originalHeaderTextId'
            ].includes(key))
        ),
    };
};

/**
 * Ensures at least one column is marked as primary key.
 * If no primary key exists, assigns the first suitable column as primary key.
 *
 * @param {Array} columns - Array of standardized columns
 * @returns {Array} Columns with at least one primary key assigned
 */
const ensurePrimaryKey = (columns) => {
    if (!Array.isArray(columns) || columns.length === 0) {
        return columns;
    }

    // Check if any column is already marked as primary key
    const hasPrimaryKey = columns.some(col => col.isPrimaryKey === true);

    if (hasPrimaryKey) {
        return columns; // Already has a primary key, no changes needed
    }

    // Find the first suitable column for primary key
    // Exclude checkbox columns and other special types
    const suitableColumnIndex = columns.findIndex(col =>
        col.colType !== 'checkbox' &&
        col.visible !== false &&
        col.alias // Must have an alias/field name
    );

    if (suitableColumnIndex === -1) {
        // Fallback: if no suitable column found, use the first column regardless
        if (columns.length > 0) {
            console.warn('ensurePrimaryKey: No suitable column found for primary key, using first column');
            return columns.map((col, idx) => ({
                ...col,
                isPrimaryKey: idx === 0
            }));
        }
        return columns;
    }

    // Assign the first suitable column as primary key
    return columns.map((col, idx) => ({
        ...col,
        isPrimaryKey: idx === suitableColumnIndex
    }));
};

export function standardizeColumns(columns) {
    if (!Array.isArray(columns)) {
        console.warn('standardizeColumns: Expected array, got:', typeof columns);
        return [];
    }

    if (columns.length === 0) {
        return [];
    }

    const standardizedColumns = columns
        .map((col, idx) => transformToApiFormat(col, idx))
        .filter(Boolean);

    // Ensure at least one primary key exists
    return ensurePrimaryKey(standardizedColumns);
}


/**
 * Maps standardized API columns to syncfusion-grid format
 */
export default function mapApiColumns(standardizedColumns, intl = null) {
    if (!Array.isArray(standardizedColumns)) {
        console.warn('mapApiColumns: Expected array, got:', typeof standardizedColumns);
        return [];
    }

    return standardizedColumns.map((col, idx) => {
        if (!col || typeof col !== 'object') {
            console.warn(`mapApiColumns: Invalid column object at index ${idx}:`, col);
            return null;
        }

        // Determine headerText - if headerTextId exists and intl is available, translate it
        let headerText = col.description;
        const headerTextId = col._originalHeaderTextId;

        if (headerTextId && intl) {
            try {
                headerText = intl.formatMessage({
                    id: headerTextId,
                    defaultMessage: col.description || headerTextId
                });
            } catch (error) {
                console.warn(`Failed to translate ${headerTextId}:`, error);
                headerText = col.description || headerTextId;
            }
        }

        const allowEditing = typeof col.readOnly === 'boolean' ? !col.readOnly : undefined;

        return {
            colNo: col.colNo,
            field: toCamelCase(col.alias),
            headerText: headerText,
            headerTextId: headerTextId || undefined, // Preserve translation key
            width: typeof col.width === 'number' && col.width > 0 ? col.width : 120,
            allowEditing,
            textAlign: ALIGNMENT_MAP[col.alignment] || undefined,
            format: col.format || undefined,
            visible: col.visible !== undefined ? col.visible : true,
            allowFiltering: col.allowColFiltering !== undefined ? col.allowColFiltering : true,
            allowSorting: col.allowColSorting !== undefined ? col.allowColSorting : true,
            isPrimaryKey: Boolean(col.isPrimaryKey),
            type: col.colType || undefined,
            template: col.colTemplate || undefined,
            customAttributes: col.colCustomAttributes || undefined,
            orderID: typeof col.orderID === 'number' ? col.orderID : idx + 1,
            colValueAccessor: col.colValueAccessor || undefined,
            // Keep original for reference
            _original: col,
        };
    }).filter(Boolean);
} 
