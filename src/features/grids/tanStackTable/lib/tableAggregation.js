import { defaultAggregationOperations } from './tableConfig';

export function parseCurrency(value) {
  const numericValue = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function parseAggregateNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? '').trim();

  if (!text) {
    return null;
  }

  const normalizedNumber = text.replaceAll(',', '');
  const hasCurrencySymbol = /[$€£¥]/.test(text);
  const isPlainNumericText = /^-?\d+(\.\d+)?$/.test(normalizedNumber);

  if (!hasCurrencySymbol && !isPlainNumericText) {
    return null;
  }

  const numericValue = Number(text.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatCurrency(value, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export function formatNumber(value, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
}

export function getColumnLabelFromColumn(column) {
  return typeof column?.columnDef?.header === 'string' ? column.columnDef.header : column?.id;
}

export function getNumericAggregateValues(tableRows, columnId) {
  return tableRows
    .map((row) => parseAggregateNumber(row.original[columnId]))
    .filter((value) => value !== null);
}

export function columnLooksAggregatable(column, tableRows) {
  if (!column || column.id === 'select') {
    return false;
  }

  const values = getNumericAggregateValues(tableRows, column.id);
  return values.length > 0 && values.some((value) => value !== 0);
}

export function getAggregationColumnOptions(columns, tableRows, aggregationConfig = {}) {
  if (Array.isArray(aggregationConfig.columns) && aggregationConfig.columns.length > 0) {
    return aggregationConfig.columns
      .map((columnConfig) => {
        const columnId = typeof columnConfig === 'string' ? columnConfig : columnConfig.id;
        const column = columns.find((visibleColumn) => visibleColumn.id === columnId);

        if (!column) {
          return null;
        }

        return {
          key: column.id,
          label: typeof columnConfig === 'object' && columnConfig.label ? columnConfig.label : getColumnLabelFromColumn(column),
        };
      })
      .filter(Boolean);
  }

  return columns
    .filter((column) => columnLooksAggregatable(column, tableRows))
    .map((column) => ({
      key: column.id,
      label: getColumnLabelFromColumn(column),
    }));
}

export function getAggregationOperations(aggregationConfig = {}) {
  return Array.isArray(aggregationConfig.operations) && aggregationConfig.operations.length > 0
    ? aggregationConfig.operations
    : defaultAggregationOperations;
}

export function formatAggregateValue({ aggregationConfig = {}, columnId, locale, operation, value }) {
  if (typeof aggregationConfig.formatValue === 'function') {
    return aggregationConfig.formatValue(value, { columnId, operation });
  }

  if (!Number.isFinite(Number(value))) {
    return String(value ?? '');
  }

  return columnId === 'revenue' ? formatCurrency(value, locale) : formatNumber(value, locale);
}

export function getColumnAggregates({ aggregationConfig = {}, columnId, labels, locale = 'en-US', tableRows }) {
  const values = getNumericAggregateValues(tableRows, columnId);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const operationValues = {
    average,
    avg: average,
    max: values.length > 0 ? Math.max(...values) : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    sum: total,
  };

  const builtInAggregates = getAggregationOperations(aggregationConfig)
    .map((operation) => {
      const normalizedOperation = operation === 'avg' ? 'average' : operation;
      const value = operationValues[operation];

      if (value === undefined) {
        return null;
      }

      return {
        key: normalizedOperation,
        label: labels[normalizedOperation] ?? labels[operation] ?? operation,
        value: formatAggregateValue({
          aggregationConfig,
          columnId,
          locale,
          operation: normalizedOperation,
          value,
        }),
      };
    })
    .filter(Boolean);

  const customAggregates = Array.isArray(aggregationConfig.customAggregates)
    ? aggregationConfig.customAggregates
        .map((aggregate) => {
          if (typeof aggregate.calculate !== 'function') {
            return null;
          }

          const value = aggregate.calculate(values, { columnId, rows: tableRows });

          return {
            key: aggregate.key ?? aggregate.label,
            label: aggregate.label ?? aggregate.key,
            value:
              typeof aggregate.format === 'function'
                ? aggregate.format(value, { columnId, rows: tableRows })
                : formatAggregateValue({
                    aggregationConfig,
                    columnId,
                    locale,
                    operation: aggregate.key,
                    value,
                  }),
          };
        })
        .filter(Boolean)
    : [];

  return [...builtInAggregates, ...customAggregates];
}
