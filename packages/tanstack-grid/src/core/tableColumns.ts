import { compileColumnDisplay } from './tableDisplay';
import { advancedColumnFilterFn } from './tableFilters';
import type { VisibilityState } from '@tanstack/react-table';

export function buildUniqueOptionsFromRows(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter((value) => value !== null && value !== undefined))];
}

export const initialRows = [];
export const baseColumns = [];

export const defaultColumnOrder = ['select', ...baseColumns.map((column) => column.accessorKey)];
export const defaultColumnSizing = {
  select: 44,
  ...Object.fromEntries(baseColumns.map((column) => [column.accessorKey, column.size])),
};
export const baseColumnById = new Map(baseColumns.map((column) => [column.accessorKey, column]));

export function getColumnId(column) {
  return column?.id ?? column?.accessorKey ?? column?.field ?? column?.alias;
}

export function buildDefaultColumnOrder(dataColumns = baseColumns) {
  return ['select', ...dataColumns.map(getColumnId).filter(Boolean)];
}

export function buildDefaultColumnSizing(dataColumns = baseColumns) {
  return {
    select: defaultColumnSizing.select,
    ...Object.fromEntries(
      dataColumns
        .map((column) => [getColumnId(column), column?.size ?? column?.width ?? 120])
        .filter(([columnId]) => Boolean(columnId)),
    ),
  };
}

export function buildColumnById(dataColumns = baseColumns) {
  const entries = dataColumns
    .map((column) => [getColumnId(column), column] as const)
    .filter((entry): entry is readonly [string, (typeof dataColumns)[number]] => Boolean(entry[0]));

  return new Map(entries);
}

export function buildColumnSettingsState({
  columnOrder = defaultColumnOrder,
  columnSizing = defaultColumnSizing,
  columnVisibility = {},
} = {}, dataColumns = baseColumns) {
  const nextDefaultColumnOrder = buildDefaultColumnOrder(dataColumns);
  const nextDefaultColumnSizing = buildDefaultColumnSizing(dataColumns);

  return {
    columnOrder: normalizeColumnOrder(columnOrder, nextDefaultColumnOrder),
    columnSizing: {
      ...nextDefaultColumnSizing,
      ...normalizeColumnSizing(columnSizing, nextDefaultColumnSizing),
      select: nextDefaultColumnSizing.select,
    },
    columnVisibility: normalizeColumnVisibility(columnVisibility, nextDefaultColumnOrder),
  };
}

export function normalizeColumnOrder(columnOrder, nextDefaultColumnOrder = defaultColumnOrder) {
  const validColumnIds = new Set(nextDefaultColumnOrder);
  const persistedOrder = Array.isArray(columnOrder)
    ? columnOrder.filter((columnId) => validColumnIds.has(columnId) && columnId !== 'select')
    : [];
  const missingColumnIds = nextDefaultColumnOrder.filter(
    (columnId) => columnId !== 'select' && !persistedOrder.includes(columnId),
  );

  return ['select', ...persistedOrder, ...missingColumnIds];
}

export function normalizeColumnSizing(columnSizing, nextDefaultColumnSizing = defaultColumnSizing) {
  const validColumnIds = new Set(Object.keys(nextDefaultColumnSizing));

  return Object.fromEntries(
    Object.entries(columnSizing ?? {}).filter(
      ([columnId, width]) => validColumnIds.has(columnId) && Number.isFinite(Number(width)),
    ),
  );
}

export function normalizeColumnVisibility(columnVisibility, nextDefaultColumnOrder = defaultColumnOrder): VisibilityState {
  const validColumnIds = new Set(nextDefaultColumnOrder);

  return Object.fromEntries(
    Object.entries(columnVisibility ?? {}).filter(([columnId]) => validColumnIds.has(columnId) && columnId !== 'select'),
  ) as VisibilityState;
}

export function extractColumnsArray(columnsData) {
  if (Array.isArray(columnsData)) {
    return columnsData;
  }

  if (Array.isArray(columnsData?.columns)) {
    return columnsData.columns;
  }

  if (Array.isArray(columnsData?.data)) {
    return columnsData.data;
  }

  return [];
}

export function buildColumnPreferencesPayload(columnSettings, dataColumns = baseColumns) {
  const normalizedSettings = buildColumnSettingsState(columnSettings, dataColumns);
  const columnById = buildColumnById(dataColumns);

  return normalizedSettings.columnOrder
    .filter((columnId) => columnId !== 'select')
    .map((columnId, index) => {
      const baseColumn = columnById.get(columnId) ?? baseColumnById.get(columnId);
      const headerText =
        typeof baseColumn?.header === 'string' ? baseColumn.header : baseColumn?.accessorKey ?? columnId;

      return {
        alias: columnId,
        field: columnId,
        headerText,
        orderID: index + 1,
        visible: normalizedSettings.columnVisibility[columnId] !== false,
        width: normalizedSettings.columnSizing[columnId] ?? baseColumn?.size ?? 120,
      };
    });
}

export function inferFilterVariant(column, dataRows) {
  const explicitVariant = column?.meta?.filterVariant;

  if (explicitVariant) {
    return explicitVariant;
  }

  const columnId = getColumnId(column);
  const uniqueValues = buildUniqueOptionsFromRows(dataRows, columnId);

  return uniqueValues.length > 1 && uniqueValues.length <= 12 ? 'select' : 'text';
}

const alignmentMap = {
  L: 'Left',
  M: 'Center',
  R: 'Right',
};

function toCamelCase(value) {
  if (!value) return value;
  return String(value).charAt(0).toLowerCase() + String(value).slice(1);
}

function getColumnFieldName(column) {
  return column?.alias ?? column?.field ?? column?.accessorKey ?? column?.id;
}

function getColumnHeaderText(column) {
  return column?.description ?? column?.headerText ?? column?.headerTextId ?? column?.header ?? getColumnFieldName(column) ?? 'Column';
}

function standardizeColumn(column, index) {
  if (!column || typeof column !== 'object') {
    return null;
  }

  if (column.type === 'checkbox' || column.colType === 'checkbox') {
    return {
      ...column,
      alias: undefined,
      description: column.headerText || '',
      width: column.width || 40,
      visible: column.visible !== undefined ? column.visible : true,
      allowColFiltering: false,
      allowColSorting: false,
      colType: 'checkbox',
      orderID: typeof column.orderID === 'number' ? column.orderID : index + 1,
      readOnly: column.readOnly !== undefined ? column.readOnly : true,
      colTemplate: column.colTemplate || column.template,
      colCustomAttributes: column.colCustomAttributes || column.customAttributes,
    };
  }

  return {
    ...column,
    alias: getColumnFieldName(column),
    description: getColumnHeaderText(column),
    width: column.width ?? column.size,
    visible: column.visible,
    isPrimaryKey: column.isPrimaryKey,
    colType: column.colType || column.type,
    format: column.format,
    orderID: typeof column.orderID === 'number' ? column.orderID : index + 1,
    readOnly: column.readOnly !== undefined
      ? column.readOnly
      : (column.allowEditing !== undefined ? !column.allowEditing : undefined),
    colTemplate: column.colTemplate || column.template,
    colCustomAttributes: column.colCustomAttributes || column.customAttributes,
    _originalHeaderTextId: column.headerTextId,
  };
}

export function standardizeColumns(columns) {
  if (!Array.isArray(columns)) {
    return [];
  }

  const standardizedColumns = columns.map(standardizeColumn).filter(Boolean);
  const hasPrimaryKey = standardizedColumns.some((column) => column.isPrimaryKey === true);

  if (hasPrimaryKey) {
    return standardizedColumns;
  }

  const primaryKeyIndex = standardizedColumns.findIndex(
    (column) => column.colType !== 'checkbox' && column.visible !== false && column.alias,
  );

  return standardizedColumns.map((column, index) => ({
    ...column,
    isPrimaryKey: index === Math.max(primaryKeyIndex, 0),
  }));
}

export function mapGridColumns(standardizedColumns) {
  if (!Array.isArray(standardizedColumns)) {
    return [];
  }

  return standardizedColumns.map((column, index) => ({
    colNo: column.colNo,
    field: toCamelCase(column.alias),
    headerText: column.description,
    headerTextId: column._originalHeaderTextId || undefined,
    width: typeof column.width === 'number' && column.width > 0 ? column.width : 120,
    allowEditing: typeof column.readOnly === 'boolean' ? !column.readOnly : undefined,
    textAlign: alignmentMap[column.alignment] || undefined,
    format: column.format || undefined,
    visible: column.visible !== undefined ? column.visible : true,
    allowFiltering: column.allowColFiltering !== undefined ? column.allowColFiltering : column.allowFiltering !== false,
    allowSorting: column.allowColSorting !== undefined ? column.allowColSorting : column.allowSorting !== false,
    isPrimaryKey: Boolean(column.isPrimaryKey),
    type: column.colType || undefined,
    template: column.colTemplate || undefined,
    customAttributes: column.colCustomAttributes || undefined,
    orderID: typeof column.orderID === 'number' ? column.orderID : index + 1,
    colValueAccessor: column.colValueAccessor || undefined,
    display: column.display,
    _original: column,
  })).filter(Boolean);
}

export function buildTanStackDataColumns(
  sourceColumns,
  {
    dataRows = initialRows,
    transformColumnsFn,
  }: { dataRows?: unknown[]; transformColumnsFn?: (columns: unknown[]) => unknown[] } = {},
) {
  const standardizedColumns = standardizeColumns(sourceColumns);
  const mappedColumns = mapGridColumns(standardizedColumns);

  const columns = mappedColumns
    .filter((column) => column.field && column.type !== 'checkbox')
    .map((column) => {
      const localColumn = baseColumnById.get(column.field);
      const filterVariant = inferFilterVariant(localColumn ?? column, dataRows);
      const filterOptions =
        localColumn?.meta?.filterOptions ??
        (filterVariant === 'select' ? buildUniqueOptionsFromRows(dataRows, column.field) : undefined);
      const compiledDisplay = compileColumnDisplay(
        localColumn?.meta?.display ?? column._original?.meta?.display ?? column.display,
        column,
      );

      return {
        ...(localColumn ?? {}),
        accessorKey: column.field,
        enableColumnFilter: column.allowFiltering !== false,
        enableSorting: column.allowSorting !== false,
        filterFn: advancedColumnFilterFn,
        header: column.headerText ?? localColumn?.header ?? column.field,
        id: column.field,
        size: column.width ?? localColumn?.size ?? 120,
        meta: {
          ...(localColumn?.meta ?? {}),
          display: compiledDisplay,
          editable: column.allowEditing ?? localColumn?.meta?.editable ?? false,
          filterOptions,
          filterVariant,
          originalColumn: column._original ?? column,
        },
      };
    });

  return typeof transformColumnsFn === 'function' ? transformColumnsFn(columns) : columns;
}
