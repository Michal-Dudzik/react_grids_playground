import { defaultAggregationOperations } from './tableConfig';

export type AggregationRowData = Record<string, unknown>;
export type AggregationOperation = 'sum' | 'average' | 'avg' | 'min' | 'max' | (string & {});

export interface AggregationColumnDef {
  header?: unknown;
}

export interface AggregationTableRow<Row extends AggregationRowData = AggregationRowData> {
  original: Row;
}

export interface AggregationColumn<Row extends AggregationRowData = AggregationRowData> {
  columnDef?: AggregationColumnDef;
  id: Extract<keyof Row, string> | string;
}

export interface AggregationColumnConfig {
  id: string;
  label?: string;
}

export interface AggregationColumnOption {
  key: string;
  label: string;
}

export interface AggregationContext<Row extends AggregationRowData = AggregationRowData> {
  columnId: string;
  rows: Array<AggregationTableRow<Row>>;
}

export interface AggregationFormatContext {
  columnId: string;
  operation: AggregationOperation | undefined;
}

export interface CustomAggregate<Row extends AggregationRowData = AggregationRowData> {
  calculate?: (values: number[], context: AggregationContext<Row>) => unknown;
  format?: (value: unknown, context: AggregationContext<Row>) => string;
  key?: string;
  label?: string;
}

export interface AggregationConfig<Row extends AggregationRowData = AggregationRowData> {
  columns?: Array<string | AggregationColumnConfig>;
  customAggregates?: Array<CustomAggregate<Row>>;
  formatValue?: (value: unknown, context: AggregationFormatContext) => string;
  labels?: Record<string, string>;
  operations?: AggregationOperation[];
}

export interface FormatAggregateValueOptions<Row extends AggregationRowData = AggregationRowData> {
  aggregationConfig?: AggregationConfig<Row>;
  columnId: string;
  locale?: string;
  operation: AggregationOperation | undefined;
  value: unknown;
}

export interface GetColumnAggregatesOptions<Row extends AggregationRowData = AggregationRowData> {
  aggregationConfig?: AggregationConfig<Row>;
  columnId: string;
  labels: Record<string, string>;
  locale?: string;
  tableRows: Array<AggregationTableRow<Row>>;
}

export interface AggregationItem {
  key: string | undefined;
  label: string | undefined;
  value: string;
}

function isPresent<Value>(value: Value | null | undefined): value is Value {
  return value !== null && value !== undefined;
}

export function parseCurrency(value: unknown): number | null {
  const numericValue: number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function parseAggregateNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text: string = String(value ?? '').trim();

  if (!text) {
    return null;
  }

  const normalizedNumber: string = text.replaceAll(',', '');
  const hasCurrencySymbol: boolean = /[$€£¥]/.test(text);
  const isPlainNumericText: boolean = /^-?\d+(\.\d+)?$/.test(normalizedNumber);

  if (!hasCurrencySymbol && !isPlainNumericText) {
    return null;
  }

  const numericValue: number = Number(text.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatCurrency(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
}

export function getColumnLabelFromColumn<Row extends AggregationRowData = AggregationRowData>(
  column: AggregationColumn<Row> | null | undefined,
): string | undefined {
  return typeof column?.columnDef?.header === 'string' ? column.columnDef.header : column?.id;
}

export function getNumericAggregateValues<Row extends AggregationRowData = AggregationRowData>(
  tableRows: Array<AggregationTableRow<Row>>,
  columnId: string,
): number[] {
  return tableRows
    .map((row: AggregationTableRow<Row>): number | null => parseAggregateNumber(row.original[columnId]))
    .filter(isPresent);
}

export function columnLooksAggregatable<Row extends AggregationRowData = AggregationRowData>(
  column: AggregationColumn<Row> | null | undefined,
  tableRows: Array<AggregationTableRow<Row>>,
): boolean {
  if (!column || column.id === 'select') {
    return false;
  }

  const values: number[] = getNumericAggregateValues(tableRows, column.id);
  return values.length > 0 && values.some((value: number): boolean => value !== 0);
}

export function getAggregationColumnOptions<Row extends AggregationRowData = AggregationRowData>(
  columns: Array<AggregationColumn<Row>>,
  tableRows: Array<AggregationTableRow<Row>>,
  aggregationConfig: AggregationConfig<Row> = {},
): AggregationColumnOption[] {
  if (Array.isArray(aggregationConfig.columns) && aggregationConfig.columns.length > 0) {
    return aggregationConfig.columns
      .map((columnConfig: string | AggregationColumnConfig): AggregationColumnOption | null => {
        const columnId: string = typeof columnConfig === 'string' ? columnConfig : columnConfig.id;
        const column: AggregationColumn<Row> | undefined = columns.find(
          (visibleColumn: AggregationColumn<Row>): boolean => visibleColumn.id === columnId,
        );

        if (!column) {
          return null;
        }

        return {
          key: column.id,
          label:
            typeof columnConfig === 'object' && columnConfig.label
              ? columnConfig.label
              : getColumnLabelFromColumn(column) ?? column.id,
        };
      })
      .filter(isPresent);
  }

  return columns
    .filter((column: AggregationColumn<Row>): boolean => columnLooksAggregatable(column, tableRows))
    .map((column: AggregationColumn<Row>): AggregationColumnOption => ({
      key: column.id,
      label: getColumnLabelFromColumn(column) ?? column.id,
    }));
}

export function getAggregationOperations<Row extends AggregationRowData = AggregationRowData>(
  aggregationConfig: AggregationConfig<Row> = {},
): AggregationOperation[] {
  return Array.isArray(aggregationConfig.operations) && aggregationConfig.operations.length > 0
    ? aggregationConfig.operations
    : defaultAggregationOperations;
}

export function formatAggregateValue<Row extends AggregationRowData = AggregationRowData>({
  aggregationConfig = {},
  columnId,
  locale,
  operation,
  value,
}: FormatAggregateValueOptions<Row>): string {
  if (typeof aggregationConfig.formatValue === 'function') {
    return aggregationConfig.formatValue(value, { columnId, operation });
  }

  const numericValue: number = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value ?? '');
  }

  return columnId === 'revenue' ? formatCurrency(numericValue, locale) : formatNumber(numericValue, locale);
}

export function getColumnAggregates<Row extends AggregationRowData = AggregationRowData>({
  aggregationConfig = {},
  columnId,
  labels,
  locale = 'en-US',
  tableRows,
}: GetColumnAggregatesOptions<Row>): AggregationItem[] {
  const values: number[] = getNumericAggregateValues(tableRows, columnId);
  const total: number = values.reduce((sum: number, value: number): number => sum + value, 0);
  const average: number = values.length > 0 ? total / values.length : 0;
  const operationValues: Partial<Record<AggregationOperation, number>> = {
    average,
    avg: average,
    max: values.length > 0 ? Math.max(...values) : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    sum: total,
  };

  const builtInAggregates: AggregationItem[] = getAggregationOperations(aggregationConfig)
    .map((operation: AggregationOperation): AggregationItem | null => {
      const normalizedOperation: AggregationOperation = operation === 'avg' ? 'average' : operation;
      const value: number | undefined = operationValues[operation];

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
    .filter(isPresent);

  const customAggregates: AggregationItem[] = Array.isArray(aggregationConfig.customAggregates)
    ? aggregationConfig.customAggregates
        .map((aggregate: CustomAggregate<Row>): AggregationItem | null => {
          if (typeof aggregate.calculate !== 'function') {
            return null;
          }

          const value: unknown = aggregate.calculate(values, { columnId, rows: tableRows });

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
        .filter(isPresent)
    : [];

  return [...builtInAggregates, ...customAggregates];
}
