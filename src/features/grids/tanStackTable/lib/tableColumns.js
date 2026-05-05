import { getDemoRows } from '../../../demoData';
import mapApiColumns, { standardizeColumns } from '../../syncfusion-grid/features/columns/mapApiColumns';
import { tableColumnStateKey } from './tableConfig';
import { compileColumnDisplay } from './tableDisplay.js';
import { advancedColumnFilterFn } from './tableFilters';

export const initialRows = getDemoRows();

function buildUniqueOptions(field) {
  return [...new Set(initialRows.map((row) => row[field]))];
}

export function buildUniqueOptionsFromRows(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter((value) => value !== null && value !== undefined))];
}

export const baseColumns = [
  {
    accessorKey: 'id',
    filterFn: advancedColumnFilterFn,
    header: 'Campaign',
    size: 150,
    meta: {
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'owner',
    filterFn: advancedColumnFilterFn,
    header: 'Owner',
    size: 180,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    filterFn: advancedColumnFilterFn,
    size: 160,
    meta: {
      editable: true,
      filterOptions: buildUniqueOptions('region'),
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: advancedColumnFilterFn,
    size: 150,
    meta: {
      editable: true,
      filterOptions: buildUniqueOptions('status'),
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'revenue',
    filterFn: advancedColumnFilterFn,
    header: 'Revenue',
    size: 140,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'updatedAt',
    filterFn: advancedColumnFilterFn,
    header: 'Updated',
    size: 140,
    meta: {
      display: {
        type: 'date',
      },
      editable: true,
      filterVariant: 'text',
    },
  },
];

export const defaultColumnOrder = ['select', ...baseColumns.map((column) => column.accessorKey)];
export const defaultColumnSizing = {
  select: 72,
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
  return new Map(dataColumns.map((column) => [getColumnId(column), column]).filter(([columnId]) => Boolean(columnId)));
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

export function normalizeColumnVisibility(columnVisibility, nextDefaultColumnOrder = defaultColumnOrder) {
  const validColumnIds = new Set(nextDefaultColumnOrder);

  return Object.fromEntries(
    Object.entries(columnVisibility ?? {}).filter(([columnId]) => validColumnIds.has(columnId) && columnId !== 'select'),
  );
}

export function readColumnState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(tableColumnStateKey) ?? '{}');
  } catch {
    return {};
  }
}

export function writeColumnState(columnState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(tableColumnStateKey, JSON.stringify(columnState));
}

export function buildGridColumnsPreferenceEndpoint({ appId, gridId }) {
  return `/api/SysUserInfo/gridColumnsByUser?appId=${encodeURIComponent(appId)}&gridId=${encodeURIComponent(gridId)}`;
}

export function buildGridColumnsFetchEndpoint({ appId, gridId, languageCode }) {
  const params = new URLSearchParams({
    appId: String(appId),
    gridId: String(gridId),
  });

  if (languageCode) {
    params.set('languageCode', languageCode);
  }

  return `/api/SysUserInfo/gridColumnsByUser?${params.toString()}`;
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

export async function fetchColumnsFromApi({ appId, gridId, languageCode, request = fetch, signal }) {
  if (!appId || !gridId) {
    return [];
  }

  const response = await request(buildGridColumnsFetchEndpoint({ appId, gridId, languageCode }), {
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch columns (${response.status})`);
  }

  return extractColumnsArray(await response.json());
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

export async function saveColumnPreferencesToApi({ appId, gridId, payload, request = fetch }) {
  if (!appId || !gridId) {
    return { success: true, skipped: true, reason: 'missing-grid-identifiers' };
  }

  const response = await request(buildGridColumnsPreferenceEndpoint({ appId, gridId }), {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Failed to save column preferences (${response.status})`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  return contentType.includes('application/json') ? response.json() : { success: true };
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

export function buildTanStackDataColumns(sourceColumns, { dataRows = initialRows, transformColumnsFn } = {}) {
  const standardizedColumns = standardizeColumns(sourceColumns);
  const mappedColumns = mapApiColumns(standardizedColumns);

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
