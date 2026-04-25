export function isLikelyAggregateColumn(col) {
    const alias = (col.alias || col.field || '').toLowerCase();
    // Exclude by name patterns
    if (
        alias === 'id' ||
        alias.endsWith('id') ||
        /rate|code|flag|status|desc|no|pos/i.test(alias)
    ) return false;
    // Only right-aligned and formatted as number
    if (col.alignment === 'R' && /\d/.test(col.format)) return true;
    // Optionally: check for format patterns
    return col.format && /0\.00/.test(col.format);

}

export const SUPPORTED_AGGREGATE_TYPES = ['sum', 'avg', 'min', 'max', 'custom'];

function computeAggregate(type, data, field, customFn) {
    if (type === 'custom') {
        return typeof customFn === 'function' ? customFn(data, field) : null;
    }

    let count = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const row of data || []) {
        const value = Number(row?.[field]);
        if (Number.isNaN(value)) continue;

        count += 1;
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
    }

    switch (type) {
        case 'sum':
            return sum;
        case 'avg':
            return count ? sum / count : 0;
        case 'min':
            return count ? min : 0;
        case 'max':
            return count ? max : 0;
        default:
            return null;
    }
}
export function getCustomAggregates(columns, pagedData, totalData, aggregationConfig) {
    // Build a map for quick lookup if config is provided - with case-insensitive keys
    const configMap = Array.isArray(aggregationConfig)
        ? Object.fromEntries(aggregationConfig.map(cfg => [cfg.field.toLowerCase(), cfg]))
        : null;

    const filteredColumns = columns
        .filter(col => {
            if (configMap) {
                const fieldToCheck = (col.alias || col.field).toLowerCase();
                return !!configMap[fieldToCheck];
            }
            return isLikelyAggregateColumn(col);
        });

    return filteredColumns.map(col => {
        const field = col.alias || col.field;
        const headerText = col.description || col.headerText || field;
        const config = configMap ? configMap[field.toLowerCase()] : null;
        const types = config?.types || ['sum'];
        const customFn = config?.customFn;
        const aggregates = {};

        types.forEach(type => {
            aggregates[type] = {
                page: computeAggregate(type, pagedData, field, customFn),
                total: computeAggregate(type, totalData, field, customFn)
            };
        });
        return {field, headerText, aggregates};
    });
} 
