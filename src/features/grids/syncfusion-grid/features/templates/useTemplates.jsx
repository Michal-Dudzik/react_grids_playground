import {useCallback} from 'react';
import {LuCheck} from 'react-icons/lu';
import {Checkbox} from 'antd';
import dayjs from 'dayjs';

// ===========================
// Helper Functions
// ===========================

/**
 * Resolves the field name from props, trying both camelCase and PascalCase versions
 * @param {object} props - The component props
 * @param {string} fieldName - The field name to resolve
 * @returns {object} { fieldName: string, value: any }
 */
function resolveFieldValue(props, fieldName) {
    if (!fieldName) {
        return {fieldName: null, value: undefined};
    }

    let value = props[fieldName];
    if (value === undefined) {
        // Try PascalCase version of field name
        const pascalFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        value = props[pascalFieldName];
        if (value !== undefined) {
            return {fieldName: pascalFieldName, value};
        }
    }

    return {fieldName, value};
}

/**
 * Formats a value for correction templates (handles numeric formatting)
 * @param {any} value - The value to format
 * @param {string} field - The field name (used to determine formatting)
 * @returns {string} Formatted value or '-'
 */
function formatCorrectionValue(value, field) {
    if (field === 'valueNum') {
        if (value == null) return '-';
        // Check if value is a finite number before calling toLocaleString
        if (typeof value === 'number' && isFinite(value)) {
            return value.toLocaleString('pl-PL', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
        return '-';
    }
    return value || '-';
}

/**
 * Renders the three parts transaction indicator
 * @param {any} value - The transaction value (2, 1, "X", " ", etc.)
 * @returns {JSX.Element} Rendered indicator
 */
function renderThreePartsIndicator(value) {
    if (value === null || value === undefined) {
        return (
            <div className="flex items-center justify-center">
                <span className="text-gray-400">-</span>
            </div>
        );
    }

    const isThreePartTransaction = value === 2 || value === "X";

    if (isThreePartTransaction) {
        return (
            <div className="flex items-center justify-center">
                <div
                    className="w-3 h-3 rounded-full bg-green-500 mr-2"
                    title="Transakcja trójstronna"
                />
                <span className="text-sm text-green-700 font-medium">Tak</span>
            </div>
        );
    }

    // Regular transaction (value === 1, " ", or "")
    const isRegularTransaction = value === 1 || value === " " || value === "";

    if (isRegularTransaction) {
        return (
            <div className="flex items-center justify-center">
                <div
                    className="w-3 h-3 rounded-full bg-red-500 mr-2"
                    title="Transakcja zwykła"
                />
                <span className="text-sm text-red-700 font-medium">Nie</span>
            </div>
        );
    }

    // For any other values, show as text
    return (
        <div className="flex items-center justify-center">
            <span className="text-sm text-gray-600">{value}</span>
        </div>
    );
}

// ===========================
// Templates
// ===========================

export function useTemplates({rules = []} = {}) {
    // Returns a function to process columns and inject templates
    const processColumns = useCallback((columns) => {
        if (!Array.isArray(columns)) return columns;
        return columns.map((col) => {
            // Find the first matching rule
            const rule = rules.find((r) => r.match(col));
            if (rule) {
                return {
                    ...col,
                    template: rule.template,
                };
            }
            return col;
        });
    }, [rules]);

    return {processColumns};
}

export function boolCheckmarkTemplate() {
    const Component = (props) => {
        if (!props) return null;

        // Get field name - try props.field first, then column.field
        let fieldName = props.field || props.column?.field;

        if (!fieldName) {
            // Fallback: try to guess the field for boolean-like values
            fieldName = Object.keys(props).find(
                key => typeof props[key] === 'boolean' || key.toLowerCase().includes('selected')
            );
        }

        if (!fieldName) return null;

        // Resolve field value with PascalCase fallback
        const {value} = resolveFieldValue(props, fieldName);

        // Handle both boolean values and 0/1 numeric values
        // Show checkmark for: true, 1 (numeric), "1" (string)
        // Don't show for: false, 0, null, undefined, empty string
        const shouldShowCheckmark = value === true || value === 1 || value === "1";

        if (!shouldShowCheckmark) return null;

        return (
            <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'green',
                height: '100%'
            }}>
       <LuCheck style={{fontSize: '1.5em'}}/>
      </span>
        );
    };
    Component.displayName = 'BoolCheckmarkTemplate';
    return Component;
}

/**
 * Usage:
 *   template: boolCheckboxTemplate({ onChange: (checked, row, field) => { ... } })
 */
export function boolCheckboxTemplate({onChange} = {}) {
    const Component = (props) => {
        if (!props) return null;
        // Prefer explicit field, then column.field like other templates
        let field = props.field || props.column?.field;
        if (!field) {
            field = Object.keys(props).find(
                key => typeof props[key] === 'boolean' || key.toLowerCase().includes('selected')
            );
        }
        const value = field ? props[field] : undefined;
        // Consider true when value is true, 1 or "1"; treat "0" as false
        const isChecked = value === true || value === 1 || value === "1";
        const handleChange = (e) => {
            if (onChange) {
                onChange(e.target.checked, props, field);
            }
        };
        return (
            <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
        <Checkbox
            checked={isChecked}
            onChange={handleChange}
        />
      </span>
        );
    };
    Component.displayName = 'BoolCheckboxTemplate';
    return Component;
}

/**
 * dataBoundCheckboxTemplate - Renders a checkbox whose state is determined by a callback, not by the row's data field.
 * Usage:
 *   template: dataBoundCheckboxTemplate({
 *     onChange: (checked, row) => { ... },
 *     isChecked: (row) => selectedIds.includes(row.id)
 *   })
 */
export function dataBoundCheckboxTemplate({onChange, isChecked}) {
    const Component = (props) => {
        if (!props) return null;

        const checked = isChecked ? isChecked(props) : false;

        const handleChange = (e) => {
            if (onChange) {
                onChange(e.target.checked, props);
            }
        };

        return (
            <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Checkbox
                    checked={checked}
                    onChange={handleChange}
                />
            </span>
        );
    };
    Component.displayName = 'DataBoundCheckboxTemplate';
    return Component;
}

export function createSearchHighlightTemplate(searchTerm, fieldName) {
    const Component = (props) => {
        if (!props) return null;

        // Resolve field name from argument or from props and guard against undefined
        const resolvedFieldName = (
            typeof fieldName === 'string' && fieldName.length > 0 ? fieldName : undefined
        ) ?? props.field ?? props.column?.field;

        // Get the value for the specific field with fallbacks using helper
        const {value} = resolveFieldValue(props, resolvedFieldName);

        // Preserve zeros and falsy values except null/undefined
        const stringValue = (value === null || value === undefined) ? '' : String(value);

        // If no search term, just return the original value
        if (!searchTerm?.trim()) {
            return <span>{stringValue}</span>;
        }

        // If empty value, return empty span
        if (stringValue === '') {
            return <span>{stringValue}</span>;
        }

        // Create highlighted content using React features instead of innerHTML
        const parts = [];
        const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

        let lastIndex = 0;
        let match;

        while ((match = searchRegex.exec(stringValue)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push(
                    <span key={`text-${lastIndex}`}>
                        {stringValue.substring(lastIndex, match.index)}
                    </span>
                );
            }

            // Add highlighted match
            parts.push(
                <span
                    key={`highlight-${match.index}`}
                    className="search-highlight"
                >
                    {match[1]}
                </span>
            );

            lastIndex = match.index + match[1].length;
        }

        // Add remaining text
        if (lastIndex < stringValue.length) {
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {stringValue.substring(lastIndex)}
                </span>
            );
        }

        return <span>{parts}</span>;
    };
    Component.displayName = 'SearchHighlightTemplate';
    return Component;
}

export function threePartsTransTemplate() {
    const Component = (props) => {
        if (!props) return null;

        const value = props.threePartsTrans;

        return (
            <div className="flex items-center justify-center h-full">
                {renderThreePartsIndicator(value)}
            </div>
        );
    };
    Component.displayName = 'ThreePartsTransTemplate';
    return Component;
}

/**
 * correctionComparisonTemplate - Renders correction data in horizontal format (old → new)
 * Usage:
 *   template: correctionComparisonTemplate('valueNum')
 *   Expects data properties: ${field}_before and ${field}_after
 */
export function correctionComparisonTemplate(field) {
    const Component = (props) => {
        if (!props) return null;

        const beforeValue = props[`${field}_before`];
        const afterValue = props[`${field}_after`];

        // If both values are the same, show single value
        if (beforeValue === afterValue) {
            return (
                <div className="flex items-center h-full px-2">
                    <span className="text-sm text-gray-900">
                        {formatCorrectionValue(beforeValue, field)}
                    </span>
                </div>
            );
        }

        // Horizontal side-by-side display
        return (
            <div className="flex items-center h-full px-2 gap-2">
                <span className="text-sm text-red-600">
                    {formatCorrectionValue(beforeValue, field)}
                </span>
                <span className="text-sm text-gray-400">→</span>
                <span className="text-sm text-gray-900">
                    {formatCorrectionValue(afterValue, field)}
                </span>
            </div>
        );
    };
    Component.displayName = 'CorrectionComparisonTemplate';
    return Component;
}

export function correctionVerticalSplitTemplate(field) {
    const Component = (props) => {
        if (!props) return null;

        const beforeValue = props[`${field}_before`];
        const afterValue = props[`${field}_after`];

        // Always show vertical split with divider
        return (
            <div className="flex flex-col h-full w-full">
                {/* Top half - Old data (Było) */}
                <div className="flex items-center justify-center flex-1 px-2 border-b border-skin-border min-h-[29px]">
                    <span className="text-sm text-red-600">
                        {formatCorrectionValue(beforeValue, field)}
                    </span>
                </div>
                {/* Bottom half - New data (Jest) */}
                <div className="flex items-center justify-center flex-1 px-2 min-h-[29px]">
                    <span className="text-sm text-gray-900">
                        {formatCorrectionValue(afterValue, field)}
                    </span>
                </div>
            </div>
        );
    };
    Component.displayName = 'CorrectionVerticalSplitTemplate';
    return Component;
}

export function correctionLabelTemplate() {
    const Component = (props) => {
        if (!props) return null;

        // Always show labels for correction mode
        return (
            <div className="flex flex-col h-full w-full text-xs font-medium">
                {/* Top half - Było */}
                <div
                    className="flex items-center justify-center flex-1 px-2 border-b border-skin-border text-red-600 min-h-[29px]">
                    Było
                </div>
                {/* Bottom half - Jest */}
                <div className="flex items-center justify-center flex-1 px-2 text-gray-700 min-h-[29px]">
                    Jest
                </div>
            </div>
        );
    };
    Component.displayName = 'CorrectionLabelTemplate';
    return Component;
}

export function verticalDividerTemplate(field) {
    const Component = (props) => {
        if (!props) return null;

        const value = props[field];

        return (
            <div className="flex flex-col h-full w-full">
                {/* Top half - Same value with divider */}
                <div className="flex items-center justify-center flex-1 px-2 border-b border-skin-border min-h-[29px]">
                    <span className="text-sm text-gray-900">
                        {formatCorrectionValue(value, field)}
                    </span>
                </div>
                {/* Bottom half - Same value */}
                <div className="flex items-center justify-center flex-1 px-2 min-h-[29px]">
                    <span className="text-sm text-gray-900">
                        {formatCorrectionValue(value, field)}
                    </span>
                </div>
            </div>
        );
    };
    Component.displayName = 'VerticalDividerTemplate';
    return Component;
}

export function correctionThreePartsVerticalTemplate() {
    const Component = (props) => {
        if (!props) return null;

        const beforeValue = props.threePartsTrans_before;
        const afterValue = props.threePartsTrans_after;
        const currentValue = props.threePartsTrans;

        // If we have before/after values, show them; otherwise show the current value in both halves
        const topValue = beforeValue !== undefined ? beforeValue : currentValue;
        const bottomValue = afterValue !== undefined ? afterValue : currentValue;

        return (
            <div className="flex flex-col h-full w-full">
                {/* Top half - Before value */}
                <div className="flex items-center justify-center flex-1 px-2 border-b border-skin-border min-h-[29px]">
                    {renderThreePartsIndicator(topValue)}
                </div>
                {/* Bottom half - After value */}
                <div className="flex items-center justify-center flex-1 px-2 min-h-[29px]">
                    {renderThreePartsIndicator(bottomValue)}
                </div>
            </div>
        );
    };
    Component.displayName = 'CorrectionThreePartsVerticalTemplate';
    return Component;
}

export function simpleDateTemplate() {
    const Component = (props) => {
        // Get field name - try props.field first, then column.field
        const fieldName = props.field || props.column?.field;

        if (!fieldName) {
            return null;
        }

        // Resolve field value with PascalCase fallback
        const {value} = resolveFieldValue(props, fieldName);

        // If no value, return empty
        if (value === undefined || value === null || value === '') {
            return <span></span>;
        }

        // If it's the default date, return empty
        if (String(value).startsWith('1900-01-01')) {
            return <span></span>;
        }

        // Try to format with dayjs
        const formatted = dayjs(value);
        if (formatted.isValid()) {
            const result = formatted.format('YYYY-MM-DD');
            return <span>{result}</span>;
        }

        // If it can't format, return original
        return <span>{String(value)}</span>;
    };
    Component.displayName = 'SimpleDateTemplate';
    return Component;
}

export function monetaryTemplate() {
    const Component = (props) => {
        if (!props) return null;

        // Get field name - try props.field first, then column.field
        const fieldName = props.field || props.column?.field;

        if (!fieldName) return null;

        // Resolve field value with PascalCase fallback
        const {value} = resolveFieldValue(props, fieldName);

        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        // If value is 0, null, undefined, or NaN, show empty cell
        if (numValue === 0 || numValue == null || isNaN(numValue)) {
            return <span></span>;
        }

        // Format with 2 decimal places and right alignment
        const formattedValue = numValue.toLocaleString('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return (
            <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end', // Right alignment
                height: '100%',
                width: '100%',
                paddingRight: '8px' // Some padding from the right edge
            }}>
                {formattedValue}
            </span>
        );
    };
    Component.displayName = 'MonetaryTemplate';
    return Component;
}

export function createSimpleDateRule() {
    return {
        match: (col) => {
            if (!col.field) return false;

            const fieldLower = col.field.toLowerCase();

            // Check for "data" or "date" anywhere in the field name (case insensitive)
            const hasData = fieldLower.includes('data');
            const hasDate = fieldLower.includes('date');
            const hasTermin = fieldLower.includes('termin'); // for terminPlatnosci

            return hasData || hasDate || hasTermin;
        },
        template: simpleDateTemplate()
    };
}

export function createColTemplateRules() {
    return [
        // Date template for type === 'data' or 'date'
        {
            match: (col) => {
                const columnType = col.colValueAccessor;
                return columnType === 'date';
            },
            template: simpleDateTemplate(),
        },
        // Monetary template for type === 'money', 'currency', or 'number'
        {
            match: (col) => {
                const columnType = col.colValueAccessor;
                return columnType === 'money';
            },
            template: monetaryTemplate(),
        },
        // Checkmark template for type === 'checkmark', 'boolean', or 'flag'
        {
            match: (col) => {
                const columnType = col.colValueAccessor;
                return columnType === 'checkmark';
            },
            template: boolCheckmarkTemplate(),
        },
        // Three parts transaction template for type === 'threePartsTrans'
        {
            match: (col) => {
                const columnType = col.colValueAccessor;
                return columnType === 'threePartsTrans';
            },
            template: threePartsTransTemplate(),
        },
    ];
}
