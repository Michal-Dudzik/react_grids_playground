import {useCallback} from "react";

function hasStyleTarget(element) {
    return Boolean(element && element.style);
}

/**
 * Flexible cell/row/column coloring and decoration hook.
 *
 * Supports both granular and unified decoration APIs:
 *
 * Granular:
 *   - getRowClassName(row)
 *   - getRowStyle(row)
 *   - getCellClassName(row, field)
 *   - getCellStyle(row, field)
 *   - getCellIcon(row, field)
 *   - getCellTooltip(row, field)
 *
 * Unified:
 *   - getRowDecoration(row): { className, style }
 *   - getCellDecoration(row, field): { className, style, icon, tooltip }
 *   - getColumnDecoration(field): { className, style } (optional, for header cells)
 *
 *
 * Helper functions (import and use in your decoration functions):
 *   - monetaryClass(value, field): returns 'cell-monetary' if you want to mark a cell as monetary
 *   - dateClass(value, field): returns 'cell-date' if you want to mark a cell as a date
 *   - cellLockClass(isLocked): returns 'cell-locked' if true
 *   - rowAttentionClass(isAttention): returns 'row-requires-attention' if true
 *
 * Example usage:
 *   import { monetaryClass, dateClass, cellLockClass, rowAttentionClass } from './useDecoration';
 *   ...
 *   getCellDecoration: (row, field) => ({
 *     className: monetaryClass(row[field], field)
 *   })
 *
 * @param {Object} options - Decoration functions
 * @returns {Object} { queryCellInfo, rowDataBound, columnHeaderBound }
 */
export function useDecoration({
                                  getRowClassName,
                                  getRowStyle,
                                  getCellClassName,
                                  getCellStyle,
                                  getCellIcon,
                                  getCellTooltip,
                                  getRowDecoration,
                                  getCellDecoration,
                                  getColumnDecoration,
                              } = {}) {
    // Utility to merge class names
    function mergeClassNames(...classes) {
        return classes.filter(Boolean).join(' ');
    }

    // Utility to merge style objects
    function mergeStyles(...styles) {
        return Object.assign({}, ...styles.filter(Boolean));
    }

    // Helper function to apply cell decoration (className and style)
    const applyCellDecoration = useCallback((args, row, field) => {
        let cellDeco = {};
        if (typeof getCellDecoration === 'function') {
            cellDeco = getCellDecoration(row, field) || {};
        }

        const className = mergeClassNames(
            typeof getCellClassName === 'function' ? getCellClassName(row, field) : '',
            cellDeco.className || ''
        );
        if (className) args.cell?.classList.add(...className.split(' '));

        const style = mergeStyles(
            typeof getCellStyle === 'function' ? getCellStyle(row, field) : undefined,
            cellDeco.style
        );
        if (style && hasStyleTarget(args.cell)) Object.assign(args.cell.style, style);

        return cellDeco;
    }, [getCellClassName, getCellStyle, getCellDecoration]);

    // Helper function to apply cell icon
    const applyCellIcon = useCallback((args, row, field, cellDeco) => {
        let icon = cellDeco.icon;
        if (icon === undefined && typeof getCellIcon === 'function') {
            icon = getCellIcon(row, field);
        }

        if (icon && args.cell && !args.cell.querySelector('.cell-icon')) {
            const iconContainer = document.createElement('span');
            iconContainer.className = 'cell-icon';
            if (typeof icon === 'string') {
                iconContainer.innerHTML = icon;
            } else if (icon && icon.type && icon.props) {
                iconContainer.innerHTML = icon.props.children || '';
            }
            args.cell.prepend(iconContainer);
        }
    }, [getCellIcon]);

    // Helper function to apply cell tooltip
    const applyCellTooltip = useCallback((args, row, field, cellDeco) => {
        let tooltip = cellDeco.tooltip;
        if (tooltip === undefined && typeof getCellTooltip === 'function') {
            tooltip = getCellTooltip(row, field);
        }

        if (tooltip && args.cell) {
            args.cell.title = tooltip;
        }
    }, [getCellTooltip]);

    // Cell-level coloring and decoration
    const queryCellInfo = useCallback((args) => {
        const row = args.data;
        const field = args.column?.field;

        const cellDeco = applyCellDecoration(args, row, field);
        applyCellIcon(args, row, field, cellDeco);
        applyCellTooltip(args, row, field, cellDeco);
    }, [applyCellDecoration, applyCellIcon, applyCellTooltip]);

    // Row-level coloring and decoration
    const rowDataBound = useCallback((args) => {
        const row = args.data;
        // Unified API
        let rowDeco = {};
        if (typeof getRowDecoration === 'function') {
            rowDeco = getRowDecoration(row) || {};
        }
        // Granular API
        let className = mergeClassNames(
            typeof getRowClassName === 'function' ? getRowClassName(row) : '',
            rowDeco.className || ''
        );
        if (className) args.row?.classList.add(...className.split(' '));
        const style = mergeStyles(
            typeof getRowStyle === 'function' ? getRowStyle(row) : undefined,
            rowDeco.style
        );
        if (style && hasStyleTarget(args.row)) Object.assign(args.row.style, style);
    }, [getRowClassName, getRowStyle, getRowDecoration]);

    // Column header-level coloring and decoration (optional)
    const columnHeaderBound = useCallback((args) => {
        const field = args.column?.field;
        let colDeco = {};
        if (typeof getColumnDecoration === 'function') {
            colDeco = getColumnDecoration(field) || {};
        }
        let className = colDeco.className || '';
        if (className) args.cell?.classList.add(...className.split(' '));
        const style = colDeco.style;
        if (style && hasStyleTarget(args.cell)) Object.assign(args.cell.style, style);
    }, [getColumnDecoration]);

    return {queryCellInfo, rowDataBound, columnHeaderBound};
}

// --- Helper functions for use in your decoration logic ---
export function monetaryClass() {
    // You can add more logic here if needed
    return 'cell-monetary';
}

export function dateClass() {
    return 'cell-date';
}

export function cellLockClass(isLocked) {
    return isLocked ? 'cell-locked' : '';
}

export function rowAttentionClass(isAttention) {
    return isAttention ? 'row-requires-attention' : '';
}


// const DEFAULT_AUTO_DECORATION_RULES = {
//     monetary: {
//         enabled: true,
//         fieldPatterns: {
//             prefixes: ['amount', 'amt', 'amo', 'price', 'cost', 'kwota', 'wartosc', 'cena'],
//             suffixes: ['amt', 'amo', 'amount', 'price', 'cost', 'total', 'sum', 'cur', 'currency'],
//             includes: ['amount', 'amt', 'amo', 'price', 'cost', 'valueNum1','valueNum2','kwota', 'wartosc', 'cena', 'total', 'sum', 'netto', 'brutto', 'gross', 'net', 'currency', 'K_10','K_11','K_12','K_13','K_14','K_15','K_16','K_17','K_18','K_19','K_20','K_21','K_22','K_23','K_24','K_25','K_26','K_27','K_28','K_29','K_30','K_31','K_32','K_33','K_34','K_35','K_36','K_37','K_38','K_39','K_40','K_41','K_42','K_43','K_44','K_45','K_46','K_47']
//         },
//         className: 'cell-monetary',
//         textAlign: 'right'
//     },
//     date: {
//         enabled: true,
//         fieldPatterns: {
//             prefixes: ['date', 'time', 'created', 'updated', 'modified', 'data', 'due', 'start', 'end', 'begin', 'finish'],
//             suffixes: ['date', 'time', 'at', 'on', 'data', 'due', 'when', 'day'],
//             includes: ['date', 'time', 'created', 'updated', 'modified', 'data', 'datum', 'czas', 'due', 'termin', 'deadline', 'expires', 'valid', 'from', 'to', 'day', 'month', 'year']
//         },
//         className: 'cell-date',
//         textAlign: 'left'
//     },
//     percentage: {
//         enabled: true,
//         fieldPatterns: {
//             prefixes: ['percent', 'pct', 'rate', 'ratio', 'proc'],
//             suffixes: ['percent', 'pct', 'rate', 'ratio', 'proc'],
//             includes: ['percent', 'pct', 'rate', 'ratio', 'proc', 'procent']
//         },
//         className: 'cell-percentage',
//         textAlign: 'right'
//     },
//     boolean: {
//         enabled: true,
//         fieldPatterns: {
//             prefixes: ['is', 'has', 'can', 'should', 'must', 'allow', 'enable', 'disable', 'show', 'hide'],
//             suffixes: ['flag', 'enabled', 'disabled', 'active', 'inactive', 'valid', 'invalid', 'visible', 'hidden', 'checked', 'selected'],
//             includes: ['active', 'enabled', 'disabled', 'valid', 'invalid', 'visible', 'hidden', 'checked', 'selected', 'flag', 'bool', 'binary', 'toggle', 'switch', 'block', 'sent', 'paid', 'confirmed', 'approved', 'rejected']
//         },
//         className: 'cell-boolean',
//         textAlign: 'center',
//         mode: 'flag' // Options: 'flag', 'text-flag', 'status-flag'
//     }
// };
