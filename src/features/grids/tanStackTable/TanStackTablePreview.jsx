import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Component, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatusBadge } from '../../demoData/StatusBadge';
import { getDemoRows } from '../../demoData';
import { Alert, Button, Dropdown, Empty } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { GridColumnsModal } from '../../../shared/components/grid/GridColumnsModal';
import { GridFooter } from '../../../shared/components/grid/GridFooter';
import { GridSummaryBar } from '../../../shared/components/grid/GridSummaryBar';
import { GridTemplateEditorModal } from '../../../shared/components/grid/GridTemplateEditorModal';
import { buildGridFooterButtons } from '../../../shared/components/grid/buildGridFooterButtons';

const initialRows = getDemoRows();
const exportableFieldIds = ['id', 'owner', 'region', 'status', 'revenue', 'updatedAt'];
const tableColumnStateKey = 'tanstack-table-preview-column-state-v1';
const tableFilterStateKey = 'tanstack-table-preview-filter-state-v1';
const presentationRulesStateKey = 'tanstack-table-preview-presentation-rules-v1';
const pageSizeChoices = [3, 5, 8];
const rowDensityConfigs = {
  compact: {
    cellPaddingY: '8px',
    editorGap: '4px',
    editorHeight: '30px',
    label: 'Compact',
    rowHeight: 44,
  },
  standard: {
    cellPaddingY: '12px',
    editorGap: '8px',
    editorHeight: '34px',
    label: 'Standard',
    rowHeight: 58,
  },
  comfortable: {
    cellPaddingY: '16px',
    editorGap: '10px',
    editorHeight: '38px',
    label: 'Comfortable',
    rowHeight: 72,
  },
};
const defaultAggregationLabels = {
  aggregateColumn: 'Aggregate column',
  average: 'Average',
  filtered: 'All filtered rows',
  max: 'Max',
  min: 'Min',
  page: 'Current page',
  scope: 'Aggregation scope',
  summary: 'Aggregates',
  sum: 'Sum',
};
const defaultAggregationOperations = ['sum', 'average', 'min', 'max'];
const defaultContextMenuConfig = {
  cellItems: [],
  disabledMap: {},
  headerItems: [],
  hiddenMap: {},
  labels: {},
};
const advancedFilterOperators = [
  { label: 'Contains', value: 'contains' },
  { label: 'Does not contain', value: 'notContains' },
  { label: 'Equals', value: 'equals' },
  { label: 'Does not equal', value: 'notEquals' },
  { label: 'Starts with', value: 'startsWith' },
  { label: 'Ends with', value: 'endsWith' },
  { label: 'Greater than', value: 'greaterThan' },
  { label: 'Less than', value: 'lessThan' },
  { label: 'Is empty', value: 'empty' },
  { label: 'Is not empty', value: 'notEmpty' },
];
const advancedFilterOperatorsWithoutInput = new Set(['empty', 'notEmpty']);
const defaultPresentationRules = [
  {
    id: 'default-live-row',
    name: 'Live campaigns',
    enabled: true,
    target: 'row',
    field: 'status',
    operator: 'equals',
    value: 'Live',
    decoration: 'success',
  },
  {
    id: 'default-review-status',
    name: 'Review status cells',
    enabled: true,
    target: 'cell',
    field: 'status',
    operator: 'equals',
    value: 'Review',
    decoration: 'warning',
    backgroundColor: '#fff4d6',
    cellDisplay: 'pill',
    textColor: '#8a5a12',
  },
  {
    id: 'default-high-revenue',
    name: 'High revenue cells',
    enabled: true,
    target: 'cell',
    field: 'revenue',
    operator: 'greaterThan',
    value: '120000',
    decoration: 'info',
    cellDisplay: 'dot',
  },
  {
    id: 'default-region-header',
    name: 'Region header',
    enabled: true,
    target: 'header',
    field: 'region',
    operator: 'equals',
    value: '',
    decoration: 'accent',
  },
];
const presentationRuleTargets = new Set(['cell', 'row', 'header']);
const presentationRuleOperators = new Set([
  'contains',
  'equals',
  'notEquals',
  'startsWith',
  'endsWith',
  'greaterThan',
  'lessThan',
  'empty',
  'notEmpty',
]);
const presentationRuleDecorations = new Set(['success', 'warning', 'info', 'accent', 'muted']);
const presentationRuleCellDisplays = new Set(['value', 'dot', 'check', 'cross', 'booleanIcon', 'pill']);
const decorationAccentColors = {
  accent: 'var(--accent)',
  info: 'var(--info)',
  muted: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};

function buildUniqueOptions(field) {
  return [...new Set(initialRows.map((row) => row[field]))];
}

const baseColumns = [
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
      editable: true,
      filterVariant: 'text',
    },
  },
];

const defaultColumnOrder = ['select', ...baseColumns.map((column) => column.accessorKey)];
const defaultColumnSizing = {
  select: 72,
  ...Object.fromEntries(baseColumns.map((column) => [column.accessorKey, column.size])),
};
const baseColumnById = new Map(baseColumns.map((column) => [column.accessorKey, column]));

function buildColumnSettingsState({
  columnOrder = defaultColumnOrder,
  columnSizing = defaultColumnSizing,
  columnVisibility = {},
} = {}) {
  return {
    columnOrder: normalizeColumnOrder(columnOrder),
    columnSizing: {
      ...defaultColumnSizing,
      ...(columnSizing ?? {}),
    },
    columnVisibility: {
      ...(columnVisibility ?? {}),
    },
  };
}

function normalizeColumnOrder(columnOrder) {
  const validColumnIds = new Set(defaultColumnOrder);
  const persistedOrder = Array.isArray(columnOrder)
    ? columnOrder.filter((columnId) => validColumnIds.has(columnId) && columnId !== 'select')
    : [];
  const missingColumnIds = defaultColumnOrder.filter(
    (columnId) => columnId !== 'select' && !persistedOrder.includes(columnId),
  );

  return ['select', ...persistedOrder, ...missingColumnIds];
}

function readColumnState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(tableColumnStateKey) ?? '{}');
  } catch {
    return {};
  }
}

function writeColumnState(columnState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(tableColumnStateKey, JSON.stringify(columnState));
}

function buildGridColumnsPreferenceEndpoint({ appId, gridId }) {
  return `/api/SysUserInfo/gridColumnsByUser?appId=${encodeURIComponent(appId)}&gridId=${encodeURIComponent(gridId)}`;
}

function buildColumnPreferencesPayload(columnSettings) {
  const normalizedSettings = buildColumnSettingsState(columnSettings);

  return normalizedSettings.columnOrder
    .filter((columnId) => columnId !== 'select')
    .map((columnId, index) => {
      const baseColumn = baseColumnById.get(columnId);
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

async function saveColumnPreferencesToApi({ appId, gridId, payload, request = fetch }) {
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

function getEmptyAdvancedFilterValue() {
  return {
    operator: 'contains',
    query: '',
    selectedValues: [],
  };
}

function normalizeAdvancedFilterValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const validOperator = advancedFilterOperators.some((operator) => operator.value === value.operator)
      ? value.operator
      : 'contains';

    return {
      operator: validOperator,
      query: String(value.query ?? ''),
      selectedValues: Array.isArray(value.selectedValues)
        ? [...new Set(value.selectedValues.map((option) => String(option ?? '')))]
        : [],
    };
  }

  return {
    ...getEmptyAdvancedFilterValue(),
    query: String(value ?? ''),
  };
}

function isAdvancedFilterActive(value) {
  const filterValue = normalizeAdvancedFilterValue(value);

  return (
    filterValue.selectedValues.length > 0 ||
    advancedFilterOperatorsWithoutInput.has(filterValue.operator) ||
    filterValue.query.trim().length > 0
  );
}

function buildColumnUniqueValues(rows, columnId) {
  return [...new Set(rows.map((row) => String(row[columnId] ?? '')))].sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

function formatFilterOptionLabel(value) {
  return value === '' ? '(Blanks)' : value;
}

function normalizeSelectedFilterValues(selectedValues, allValues) {
  const allValueSet = new Set(allValues);
  const normalizedValues = [...new Set(selectedValues.map((value) => String(value ?? '')))].filter((value) =>
    allValueSet.has(value),
  );

  return normalizedValues.length === allValues.length ? [] : normalizedValues;
}

function getComparableFilterText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function advancedColumnFilterFn(row, columnId, filterValue) {
  const normalizedFilter = normalizeAdvancedFilterValue(filterValue);
  const rawValue = row.getValue(columnId);
  const textValue = String(rawValue ?? '');
  const normalizedValue = getComparableFilterText(textValue);
  const normalizedQuery = getComparableFilterText(normalizedFilter.query);

  if (normalizedFilter.selectedValues.length > 0 && !normalizedFilter.selectedValues.includes(textValue)) {
    return false;
  }

  switch (normalizedFilter.operator) {
    case 'empty':
      return textValue.trim().length === 0;
    case 'notEmpty':
      return textValue.trim().length > 0;
    case 'notContains':
      return normalizedQuery ? !normalizedValue.includes(normalizedQuery) : true;
    case 'equals':
      return normalizedQuery ? normalizedValue === normalizedQuery : true;
    case 'notEquals':
      return normalizedQuery ? normalizedValue !== normalizedQuery : true;
    case 'startsWith':
      return normalizedQuery ? normalizedValue.startsWith(normalizedQuery) : true;
    case 'endsWith':
      return normalizedQuery ? normalizedValue.endsWith(normalizedQuery) : true;
    case 'greaterThan': {
      const actualNumber = parseAggregateNumber(rawValue);
      const expectedNumber = parseAggregateNumber(normalizedFilter.query);
      return actualNumber !== null && expectedNumber !== null && actualNumber > expectedNumber;
    }
    case 'lessThan': {
      const actualNumber = parseAggregateNumber(rawValue);
      const expectedNumber = parseAggregateNumber(normalizedFilter.query);
      return actualNumber !== null && expectedNumber !== null && actualNumber < expectedNumber;
    }
    case 'contains':
    default:
      return normalizedQuery ? normalizedValue.includes(normalizedQuery) : true;
  }
}

function normalizeFilterState(filterState) {
  const validColumnIds = new Set(defaultColumnOrder);
  const columnFilters = Array.isArray(filterState?.columnFilters)
    ? filterState.columnFilters
        .filter((filter) => validColumnIds.has(filter?.id) && filter.id !== 'select')
        .map((filter) => ({
          id: filter.id,
          value: normalizeAdvancedFilterValue(filter.value),
        }))
        .filter((filter) => isAdvancedFilterActive(filter.value))
    : [];
  const globalFilter = String(filterState?.globalFilter ?? '').trim();

  return {
    columnFilters,
    globalFilter,
    showFilters: Boolean(filterState?.showFilters) || columnFilters.length > 0,
  };
}

function readFilterState() {
  if (typeof window === 'undefined') {
    return normalizeFilterState();
  }

  try {
    return normalizeFilterState(JSON.parse(window.localStorage.getItem(tableFilterStateKey) ?? '{}'));
  } catch {
    return normalizeFilterState();
  }
}

function writeFilterState(filterState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(tableFilterStateKey, JSON.stringify(normalizeFilterState(filterState)));
}

function cloneDefaultPresentationRules() {
  return defaultPresentationRules.map((rule) => ({ ...rule }));
}

function createPresentationRule(overrides = {}) {
  const ruleId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `presentation-rule-${Date.now()}`;

  return {
    id: ruleId,
    name: 'New rule',
    enabled: true,
    target: 'cell',
    field: 'status',
    operator: 'equals',
    value: 'Live',
    decoration: 'info',
    backgroundColor: '',
    cellDisplay: 'value',
    textColor: '',
    ...overrides,
  };
}

function normalizeColorValue(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? value : '';
}

function normalizePresentationRule(rule, index = 0) {
  const target = presentationRuleTargets.has(rule?.target) ? rule.target : 'cell';
  const operator = presentationRuleOperators.has(rule?.operator) ? rule.operator : 'equals';
  const decoration = presentationRuleDecorations.has(rule?.decoration) ? rule.decoration : 'info';
  const cellDisplay = presentationRuleCellDisplays.has(rule?.cellDisplay) ? rule.cellDisplay : 'value';

  return {
    id: rule?.id ?? `presentation-rule-${index}`,
    name: String(rule?.name || `Rule ${index + 1}`),
    enabled: rule?.enabled !== false,
    target,
    field: String(rule?.field || 'status'),
    operator: target === 'header' ? 'equals' : operator,
    value: String(rule?.value ?? ''),
    decoration,
    backgroundColor: normalizeColorValue(rule?.backgroundColor),
    cellDisplay: target === 'cell' ? cellDisplay : 'value',
    textColor: normalizeColorValue(rule?.textColor),
  };
}

function normalizePresentationRules(rules) {
  if (!Array.isArray(rules)) {
    return cloneDefaultPresentationRules();
  }

  return rules.map((rule, index) => normalizePresentationRule(rule, index));
}

function readPresentationRules() {
  if (typeof window === 'undefined') {
    return cloneDefaultPresentationRules();
  }

  try {
    const storedRules = JSON.parse(window.localStorage.getItem(presentationRulesStateKey) ?? 'null');
    return storedRules === null ? cloneDefaultPresentationRules() : normalizePresentationRules(storedRules);
  } catch {
    return cloneDefaultPresentationRules();
  }
}

function writePresentationRules(rules) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(presentationRulesStateKey, JSON.stringify(rules));
}

function parseCurrency(value) {
  const numericValue = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function parseAggregateNumber(value) {
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

function formatCurrency(value, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatNumber(value, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
}

function getColumnLabelFromColumn(column) {
  return typeof column?.columnDef?.header === 'string' ? column.columnDef.header : column?.id;
}

function getNumericAggregateValues(tableRows, columnId) {
  return tableRows
    .map((row) => parseAggregateNumber(row.original[columnId]))
    .filter((value) => value !== null);
}

function columnLooksAggregatable(column, tableRows) {
  if (!column || column.id === 'select') {
    return false;
  }

  const values = getNumericAggregateValues(tableRows, column.id);
  return values.length > 0 && values.some((value) => value !== 0);
}

function getAggregationColumnOptions(columns, tableRows, aggregationConfig = {}) {
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

function getAggregationOperations(aggregationConfig = {}) {
  return Array.isArray(aggregationConfig.operations) && aggregationConfig.operations.length > 0
    ? aggregationConfig.operations
    : defaultAggregationOperations;
}

function formatAggregateValue({ aggregationConfig = {}, columnId, locale, operation, value }) {
  if (typeof aggregationConfig.formatValue === 'function') {
    return aggregationConfig.formatValue(value, { columnId, operation });
  }

  if (!Number.isFinite(Number(value))) {
    return String(value ?? '');
  }

  return columnId === 'revenue' ? formatCurrency(value, locale) : formatNumber(value, locale);
}

function getColumnAggregates({ aggregationConfig = {}, columnId, labels, locale = 'en-US', tableRows }) {
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

function getCellValue(row, columnId) {
  return row?.original?.[columnId] ?? '';
}

function matchesPresentationRule(rule, { columnId, row, target }) {
  if (!rule.enabled || rule.target !== target) {
    return false;
  }

  if (target === 'header') {
    return rule.field === columnId;
  }

  if (!row) {
    return false;
  }

  if (target === 'cell' && rule.field !== columnId) {
    return false;
  }

  const actualValue = String(getCellValue(row, rule.field) ?? '').trim();
  const expectedValue = String(rule.value ?? '').trim();
  const normalizedActual = actualValue.toLowerCase();
  const normalizedExpected = expectedValue.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return normalizedActual === normalizedExpected;
    case 'notEquals':
      return normalizedActual !== normalizedExpected;
    case 'startsWith':
      return normalizedActual.startsWith(normalizedExpected);
    case 'endsWith':
      return normalizedActual.endsWith(normalizedExpected);
    case 'greaterThan':
      return parseCurrency(actualValue) > parseCurrency(expectedValue);
    case 'lessThan':
      return parseCurrency(actualValue) < parseCurrency(expectedValue);
    case 'empty':
      return actualValue.length === 0;
    case 'notEmpty':
      return actualValue.length > 0;
    case 'contains':
    default:
      return normalizedActual.includes(normalizedExpected);
  }
}

function getMatchingPresentationRule(rules, context) {
  return rules.find((rule) => matchesPresentationRule(rule, context));
}

function getPresentationClassName(target, rule) {
  return rule ? `tanstack-grid__presentation-${target}--${rule.decoration}` : '';
}

function getPresentationTooltip(rule) {
  return rule ? `Presentation rule: ${rule.name}` : undefined;
}

function getPresentationStyle(rule) {
  if (!rule) {
    return {};
  }

  return {
    ...(rule.backgroundColor ? { backgroundColor: rule.backgroundColor } : {}),
    ...(rule.textColor ? { color: rule.textColor } : {}),
  };
}

function getPresentationAccent(rule) {
  return rule?.textColor || decorationAccentColors[rule?.decoration] || 'var(--accent)';
}

function isTruthyDisplayValue(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());
}

function reorderItems(items, activeId, overId) {
  const getItemId = (item) => (typeof item === 'string' ? item : item.id);
  const activeIndex = items.findIndex((item) => getItemId(item) === activeId);
  const overIndex = items.findIndex((item) => getItemId(item) === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return items;
  }

  const reorderedItems = [...items];
  const [activeItem] = reorderedItems.splice(activeIndex, 1);
  reorderedItems.splice(overIndex, 0, activeItem);

  return reorderedItems;
}

function copyText(value) {
  const text = String(value ?? '');

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

function mergeClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

function getResolvedProps(propGetter, context) {
  return typeof propGetter === 'function' ? propGetter(context) ?? {} : {};
}

function callOptionalHandler(handler, event, context) {
  if (typeof handler === 'function') {
    handler(event, context);
  }
}

function normalizeContextMenuConfig(contextMenuConfig = {}) {
  return {
    ...defaultContextMenuConfig,
    ...contextMenuConfig,
    disabledMap: {
      ...defaultContextMenuConfig.disabledMap,
      ...(contextMenuConfig.disabledMap ?? {}),
    },
    hiddenMap: {
      ...defaultContextMenuConfig.hiddenMap,
      ...(contextMenuConfig.hiddenMap ?? {}),
    },
    labels: {
      ...defaultContextMenuConfig.labels,
      ...(contextMenuConfig.labels ?? {}),
    },
  };
}

function resolveContextMenuRule(rule, item, menuState) {
  return typeof rule === 'function' ? rule({ item, menuState }) : Boolean(rule);
}

function prepareContextMenuItems(items, menuState, contextMenuConfig) {
  const normalizedConfig = normalizeContextMenuConfig(contextMenuConfig);

  return items
    .map((item) => {
      const hiddenRule = normalizedConfig.hiddenMap[item.key];

      if (resolveContextMenuRule(hiddenRule, item, menuState)) {
        return null;
      }

      const disabledRule = normalizedConfig.disabledMap[item.key];
      const nextItem = {
        ...item,
        disabled: item.disabled || resolveContextMenuRule(disabledRule, item, menuState),
        label: normalizedConfig.labels[item.key] ?? item.label,
      };

      if (Array.isArray(nextItem.items)) {
        nextItem.items = prepareContextMenuItems(nextItem.items, menuState, normalizedConfig);
      }

      return nextItem;
    })
    .filter(Boolean);
}

function normalizeCustomContextMenuItems(items, menuState) {
  const customItems = typeof items === 'function' ? items(menuState) : items;
  return Array.isArray(customItems) ? customItems : [];
}

function renderHighlightedText(value, searchTerm) {
  const text = value == null ? '' : String(value);
  const normalizedSearch = searchTerm?.trim();

  if (!normalizedSearch) {
    return text;
  }

  const escapedTerm = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedSearch.toLowerCase() ? (
      <mark className="search-highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function renderPresentationCellContent(cellContent, rule, rawValue) {
  if (!rule || rule.cellDisplay === 'value') {
    return (
      <>
        <div className="tanstack-grid__cell-value">{cellContent}</div>
        {rule ? (
          <span
            aria-hidden="true"
            className="tanstack-grid__decoration-icon"
            style={{ '--presentation-accent': getPresentationAccent(rule) }}
          />
        ) : null}
      </>
    );
  }

  if (rule.cellDisplay === 'pill') {
    return (
      <span
        className="tanstack-grid__replacement tanstack-grid__replacement--pill"
        style={{ '--presentation-accent': getPresentationAccent(rule) }}
      >
        {String(rawValue ?? '') || 'Empty'}
      </span>
    );
  }

  if (rule.cellDisplay === 'booleanIcon') {
    const isTruthy = isTruthyDisplayValue(rawValue);

    return (
      <span
        aria-label={isTruthy ? 'True' : 'False'}
        className="tanstack-grid__replacement tanstack-grid__replacement--mark"
        style={{ '--presentation-accent': rule.textColor || (isTruthy ? 'var(--success)' : '#b42318') }}
      >
        {isTruthy ? '✓' : '×'}
      </span>
    );
  }

  if (rule.cellDisplay === 'check' || rule.cellDisplay === 'cross') {
    const isCheck = rule.cellDisplay === 'check';

    return (
      <span
        aria-label={isCheck ? 'Check mark' : 'Cross mark'}
        className="tanstack-grid__replacement tanstack-grid__replacement--mark"
        style={{ '--presentation-accent': getPresentationAccent(rule) }}
      >
        {isCheck ? '✓' : '×'}
      </span>
    );
  }

  return (
    <span
      aria-label={String(rawValue ?? '')}
      className="tanstack-grid__replacement tanstack-grid__replacement--dot"
      style={{ '--presentation-accent': getPresentationAccent(rule) }}
    />
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildCsvContent(columns, tableRows) {
  const headerRow = columns.map((column) => buildCsvValue(column.columnDef.header ?? column.id)).join(',');
  const dataRows = tableRows.map((row) =>
    columns
      .map((column) => buildCsvValue(row.original[column.id]))
      .join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

function downloadCsvFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPrintableMarkup({ columns, rows: tableRows, title }) {
  const headerMarkup = columns
    .map((column) => `<th>${escapeHtml(column.columnDef.header ?? column.id)}</th>`)
    .join('');
  const colgroupMarkup = columns
    .map((column) => {
      const width = Number(column.getSize?.() ?? column.columnDef.size ?? 140);
      return `<col style="width: ${Math.max(72, Math.round(width))}px" />`;
    })
    .join('');

  const bodyMarkup = tableRows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(row.original[column.id])}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            margin: 24px;
            font-family: "Avenir Next", "Segoe UI", sans-serif;
            color: #231d18;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 20px;
          }

          p {
            margin: 0 0 16px;
            color: #625649;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th,
          td {
            padding: 10px 12px;
            border: 1px solid #d8cdc0;
            text-align: left;
          }

          th {
            background: #f4ede3;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${tableRows.length} rows</p>
        <table>
          <colgroup>${colgroupMarkup}</colgroup>
          <thead>
            <tr>${headerMarkup}</tr>
          </thead>
          <tbody>${bodyMarkup}</tbody>
        </table>
      </body>
    </html>
  `;
}

function openPrintWindow({ columns, rows: tableRows, title }) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.border = '0';

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 0);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.onafterprint = cleanup;
    frameWindow.focus();
    window.setTimeout(() => {
      frameWindow.print();
    }, 50);
  };

  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;

  if (!frameDocument) {
    cleanup();
    return;
  }

  frameDocument.open();
  frameDocument.write(buildPrintableMarkup({ columns, rows: tableRows, title }));
  frameDocument.close();
}

class TanStackTableErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="tanstack-grid">
          <Alert
            description={this.state.error?.message ?? 'The grid failed to render.'}
            message="TanStack table error"
            showIcon
            type="error"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

function TableCheckbox({ checked, indeterminate = false, ...props }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate && !checked;
    }
  }, [checked, indeterminate]);

  return <input checked={checked} ref={inputRef} type="checkbox" {...props} />;
}

function AdvancedColumnFilterButton({
  column,
  isOpen,
  onClear,
  onClose,
  onFilterChange,
  onToggle,
  rows,
}) {
  const panelRef = useRef(null);
  const [valueSearch, setValueSearch] = useState('');
  const filterValue = normalizeAdvancedFilterValue(column.getFilterValue());
  const isActive = isAdvancedFilterActive(filterValue);
  const label = getColumnLabelFromColumn(column);
  const allColumnValues = useMemo(() => buildColumnUniqueValues(rows, column.id), [column.id, rows]);
  const visibleColumnValues = useMemo(() => {
    const normalizedSearch = valueSearch.trim().toLowerCase();

    return normalizedSearch
      ? allColumnValues.filter((value) => value.toLowerCase().includes(normalizedSearch))
      : allColumnValues;
  }, [allColumnValues, valueSearch]);
  const selectedValues = filterValue.selectedValues;
  const selectedValueSet = new Set(selectedValues);
  const allValuesSelected = selectedValues.length === 0;
  const conditionActive =
    advancedFilterOperatorsWithoutInput.has(filterValue.operator) || filterValue.query.trim().length > 0;
  const allVisibleValuesSelected =
    allValuesSelected ||
    (visibleColumnValues.length > 0 && visibleColumnValues.every((value) => selectedValueSet.has(value)));
  const someValuesSelected =
    !allValuesSelected &&
    visibleColumnValues.some((value) => selectedValueSet.has(value)) &&
    !allVisibleValuesSelected;
  const selectedSummary = allValuesSelected
    ? conditionActive
      ? 'Rule'
      : 'All'
    : `${selectedValues.length}/${allColumnValues.length}`;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (panelRef.current?.contains(event.target)) {
        return;
      }

      onClose();
    }

    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setValueSearch('');
    }
  }, [isOpen]);

  function commitFilter(patch) {
    onFilterChange(column.id, {
      ...filterValue,
      ...patch,
    });
  }

  function commitSelectedValues(nextSelectedValues) {
    commitFilter({
      selectedValues: normalizeSelectedFilterValues(nextSelectedValues, allColumnValues),
    });
  }

  function toggleFilterOption(option) {
    if (allValuesSelected) {
      commitSelectedValues(allColumnValues.filter((value) => value !== option));
      return;
    }

    if (selectedValueSet.has(option)) {
      commitSelectedValues(selectedValues.filter((value) => value !== option));
      return;
    }

    commitSelectedValues([...selectedValues, option]);
  }

  function toggleVisibleOptions() {
    if (allVisibleValuesSelected) {
      const currentSelection = allValuesSelected ? allColumnValues : selectedValues;
      const visibleValueSet = new Set(visibleColumnValues);
      commitSelectedValues(currentSelection.filter((value) => !visibleValueSet.has(value)));
      return;
    }

    commitSelectedValues([...selectedValues, ...visibleColumnValues]);
  }

  return (
    <div className="tanstack-grid__filter-menu-wrap" ref={panelRef}>
      <button
        className={mergeClassNames(
          'tanstack-grid__filter-trigger',
          isActive ? 'tanstack-grid__filter-trigger--active' : '',
        )}
        onClick={onToggle}
        type="button"
      >
        <span>{label}</span>
        <strong>{selectedSummary}</strong>
      </button>

      {isOpen ? (
        <div className="tanstack-grid__filter-menu">
          <div className="tanstack-grid__filter-menu-title">
            <span>{label}</span>
            <button aria-label="Close filter menu" onClick={onClose} type="button">
              ×
            </button>
          </div>

          <div className="tanstack-grid__filter-menu-actions">
            <button onClick={() => column.toggleSorting(false)} type="button">
              Sort A to Z
            </button>
            <button onClick={() => column.toggleSorting(true)} type="button">
              Sort Z to A
            </button>
            <button disabled={!column.getIsSorted()} onClick={() => column.clearSorting()} type="button">
              Clear sort
            </button>
          </div>

          <div className="tanstack-grid__filter-condition">
            <label className="tanstack-grid__field">
              <span>Condition</span>
              <select
                onChange={(event) => commitFilter({ operator: event.target.value })}
                value={filterValue.operator}
              >
                {advancedFilterOperators.map((operator) => (
                  <option key={operator.value} value={operator.value}>
                    {operator.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="tanstack-grid__field">
              <span>Value</span>
              <input
                disabled={advancedFilterOperatorsWithoutInput.has(filterValue.operator)}
                onChange={(event) => commitFilter({ query: event.target.value })}
                placeholder="Filter value"
                type="text"
                value={filterValue.query}
              />
            </label>
          </div>

          <div className="tanstack-grid__filter-values">
            <input
              aria-label={`Search ${label} values`}
              onChange={(event) => setValueSearch(event.target.value)}
              placeholder="Search values"
              type="text"
              value={valueSearch}
            />
            <label className="tanstack-grid__filter-check">
              <TableCheckbox
                checked={allVisibleValuesSelected}
                indeterminate={someValuesSelected}
                onChange={toggleVisibleOptions}
              />
              <span>Select all</span>
            </label>
            <div className="tanstack-grid__filter-options">
              {visibleColumnValues.map((option) => (
                <label className="tanstack-grid__filter-check" key={option}>
                  <input
                    checked={allValuesSelected || selectedValueSet.has(option)}
                    onChange={() => toggleFilterOption(option)}
                    type="checkbox"
                  />
                  <span>{formatFilterOptionLabel(option)}</span>
                </label>
              ))}
              {visibleColumnValues.length === 0 ? (
                <span className="tanstack-grid__filter-empty">No values found</span>
              ) : null}
            </div>
          </div>

          <div className="tanstack-grid__filter-menu-footer">
            <button disabled={!isActive} onClick={() => onClear(column.id)} type="button">
              Clear
            </button>
            <button className="tanstack-grid__button--primary" onClick={onClose} type="button">
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContextMenuItemButton({ item, onSelect }) {
  if (item.separator) {
    return <div className="tanstack-grid__context-menu-separator" role="separator" />;
  }

  const hasSubmenu = item.items?.length > 0;

  return (
    <div className="tanstack-grid__context-menu-item-wrap">
      <button
        className="tanstack-grid__context-menu-item"
        disabled={item.disabled}
        onClick={() => {
          if (!hasSubmenu) {
            onSelect(item);
          }
        }}
        type="button"
      >
        <span>{item.label}</span>
        {item.meta ? <span className="tanstack-grid__context-menu-meta">{item.meta}</span> : null}
        {hasSubmenu ? <span className="tanstack-grid__context-menu-arrow">›</span> : null}
      </button>

      {hasSubmenu ? (
        <div className="tanstack-grid__context-submenu" role="menu">
          {item.items.map((childItem) => (
            <ContextMenuItemButton item={childItem} key={childItem.key} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ContextMenu({ items, onClose, onSelect, state }) {
  if (!state) {
    return null;
  }

  return createPortal(
    <div
      className={`tanstack-grid__context-menu ${
        state.submenuPlacement === 'left' ? 'tanstack-grid__context-menu--submenu-left' : ''
      }`.trim()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
      style={{
        left: state.x,
        top: state.y,
      }}
    >
      <div className="tanstack-grid__context-menu-title">{state.label}</div>
      {items.map((item) => (
        <ContextMenuItemButton item={item} key={item.key} onSelect={onSelect} />
      ))}
      <button className="tanstack-grid__context-menu-close" onClick={onClose} type="button">
        Close
      </button>
    </div>,
    document.body,
  );
}

function EditableCell({ column, getValue, renderPreview, row, searchTerm, table }) {
  const value = getValue() ?? '';
  const columnMeta = column.columnDef.meta ?? {};
  const showSearchPreview = !renderPreview && Boolean(searchTerm?.trim());

  if (!columnMeta.editable) {
    return renderPreview ? renderPreview(value, searchTerm) : renderHighlightedText(value, searchTerm);
  }

  function updateValue(nextValue) {
    table.options.meta?.updateData?.(row.original.id, column.id, nextValue);
  }

  return (
    <div className="tanstack-grid__editable-cell">
      {renderPreview ? (
        <span className="tanstack-grid__editable-preview">{renderPreview(value, searchTerm)}</span>
      ) : showSearchPreview ? (
        <span className="tanstack-grid__editable-preview">{renderHighlightedText(value, searchTerm)}</span>
      ) : null}
      {columnMeta.filterVariant === 'select' ? (
        <select
          aria-label={`Edit ${column.columnDef.header}`}
          onChange={(event) => updateValue(event.target.value)}
          value={value}
        >
          {columnMeta.filterOptions?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-label={`Edit ${column.columnDef.header}`}
          onChange={(event) => updateValue(event.target.value)}
          type="text"
          value={value}
        />
      )}
    </div>
  );
}

const TanStackTablePreviewContent = forwardRef(function TanStackTablePreviewContent({
  aggregationConfig = {},
  appId,
  contextMenuConfig = {},
  getCellProps,
  getHeaderProps,
  getRowProps,
  gridId,
  loading = false,
  locale = 'en-US',
  onRowDoubleClick,
  onSaveColumnPreferences = saveColumnPreferencesToApi,
  onSearchPropsChange,
  onSelectionChange,
  tableProps = {},
  tableWrapperProps = {},
} = {}, ref) {
  const persistedColumnState = useMemo(readColumnState, []);
  const persistedFilterState = useMemo(readFilterState, []);
  const initialColumnSettings = useMemo(() => buildColumnSettingsState(persistedColumnState), [persistedColumnState]);
  const tableWrapRef = useRef(null);
  const [tableData, setTableData] = useState(() => initialRows);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState(() => persistedFilterState.columnFilters);
  const [globalFilterDraft, setGlobalFilterDraft] = useState(() => persistedFilterState.globalFilter);
  const [globalFilter, setGlobalFilter] = useState(() => persistedFilterState.globalFilter);
  const [rowSelection, setRowSelection] = useState({});
  const [selectionMode, setSelectionMode] = useState('multi');
  const [selectedRowsReport, setSelectedRowsReport] = useState([]);
  const [columnOrder, setColumnOrder] = useState(() => initialColumnSettings.columnOrder);
  const [columnSizing, setColumnSizing] = useState(() => initialColumnSettings.columnSizing);
  const [columnVisibility, setColumnVisibility] = useState(() => initialColumnSettings.columnVisibility);
  const [columnSettingsDraft, setColumnSettingsDraft] = useState(() => initialColumnSettings);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [showAllRows, setShowAllRows] = useState(false);
  const [autoPageSize, setAutoPageSize] = useState(false);
  const [rowDensity, setRowDensity] = useState('standard');
  const [showFilters, setShowFilters] = useState(() => persistedFilterState.showFilters);
  const [showSummary, setShowSummary] = useState(false);
  const [aggregationScope, setAggregationScope] = useState('page');
  const [aggregationColumnId, setAggregationColumnId] = useState('revenue');
  const [lastDoubleClickedRow, setLastDoubleClickedRow] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [openFilterColumnId, setOpenFilterColumnId] = useState('');
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [columnSettingsSaving, setColumnSettingsSaving] = useState(false);
  const [columnSettingsError, setColumnSettingsError] = useState('');
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [presentationRules, setPresentationRules] = useState(readPresentationRules);

  useEffect(() => {
    setRowSelection({});
  }, [selectionMode]);

  useEffect(() => {
    writeColumnState({
      columnOrder,
      columnSizing,
      columnVisibility,
    });
  }, [columnOrder, columnSizing, columnVisibility]);

  useEffect(() => {
    writePresentationRules(presentationRules);
  }, [presentationRules]);

  useEffect(() => {
    writeFilterState({
      columnFilters,
      globalFilter,
      showFilters,
    });
  }, [columnFilters, globalFilter, showFilters]);

  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0
        ? current
        : {
            ...current,
            pageIndex: 0,
          },
    );
  }, [columnFilters, globalFilter]);

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    function closeContextMenu() {
      setContextMenu(null);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    }

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [contextMenu]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        enableHiding: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: defaultColumnSizing.select,
        header: ({ table }) =>
          selectionMode === 'multi' ? (
            <TableCheckbox
              aria-label="Select all rows"
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          ) : (
            <span>Select</span>
          ),
        cell: ({ row }) =>
          selectionMode === 'multi' ? (
            <TableCheckbox
              aria-label={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          ) : (
            <input
              aria-label={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              name="tanstack-selection"
              onChange={row.getToggleSelectedHandler()}
              type="radio"
            />
          ),
      },
      ...baseColumns.map((column) => ({
        ...column,
        cell:
          column.accessorKey === 'status'
            ? (cellContext) => (
                <EditableCell
                  {...cellContext}
                  renderPreview={(value, searchTerm) => (
                    <StatusBadge value={value}>{renderHighlightedText(value, searchTerm)}</StatusBadge>
                  )}
                  searchTerm={globalFilter}
                />
              )
            : (cellContext) => (
                <EditableCell
                  {...cellContext}
                  searchTerm={globalFilter}
                />
              ),
      })),
    ],
    [globalFilter, selectionMode],
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableMultiRowSelection: selectionMode === 'multi',
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    meta: {
      updateData: (rowId, columnId, value) => {
        setTableData((currentRows) =>
          currentRows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)),
        );
      },
    },
    state: {
      columnFilters,
      columnOrder,
      columnSizing,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
      sorting,
    },
  });

  const matchingRows = table.getPrePaginationRowModel().rows;
  const visibleRows = showAllRows ? matchingRows : table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;
  const aggregateRows = aggregationScope === 'filtered' ? matchingRows : visibleRows;
  const visibleExportColumns = table
    .getVisibleLeafColumns()
    .filter((column) => exportableFieldIds.includes(column.id));
  const aggregationLabels = {
    ...defaultAggregationLabels,
    ...(aggregationConfig.labels ?? {}),
  };
  const aggregationColumnOptions = getAggregationColumnOptions(
    visibleExportColumns,
    matchingRows,
    aggregationConfig,
  );
  const selectedAggregationColumnId = aggregationColumnOptions.some((option) => option.key === aggregationColumnId)
    ? aggregationColumnId
    : aggregationColumnOptions[0]?.key ?? '';
  const aggregateItems = selectedAggregationColumnId
    ? getColumnAggregates({
        aggregationConfig,
        columnId: selectedAggregationColumnId,
        labels: aggregationLabels,
        locale,
        tableRows: aggregateRows,
      })
    : [];
  const activeColumnFilters = columnFilters.filter((filter) => isAdvancedFilterActive(filter.value)).length;
  const activePresentationRules = presentationRules.filter((rule) => rule.enabled).length;
  const rowDensityConfig = rowDensityConfigs[rowDensity] ?? rowDensityConfigs.standard;
  const pageSizeOptions = useMemo(
    () =>
      pageSizeChoices.includes(pagination.pageSize)
        ? pageSizeChoices
        : [...pageSizeChoices, pagination.pageSize].sort((first, second) => first - second),
    [pagination.pageSize],
  );

  useEffect(() => {
    if (aggregationColumnId !== selectedAggregationColumnId) {
      setAggregationColumnId(selectedAggregationColumnId);
    }
  }, [aggregationColumnId, selectedAggregationColumnId]);

  useEffect(() => {
    if (!autoPageSize || showAllRows) {
      return undefined;
    }

    const tableWrapElement = tableWrapRef.current;

    if (!tableWrapElement) {
      return undefined;
    }

    function updateAutoPageSize() {
      const headerHeight =
        tableWrapElement.querySelector('thead')?.getBoundingClientRect().height ?? rowDensityConfig.rowHeight;
      const tableTop = tableWrapElement.getBoundingClientRect().top;
      const reservedFooterHeight = 148;
      const availableTableHeight = Math.max(
        rowDensityConfig.rowHeight * 2,
        window.innerHeight - tableTop - reservedFooterHeight,
      );
      const nextPageSize = Math.max(
        1,
        Math.min(
          Math.max(matchingRows.length, 1),
          Math.floor((availableTableHeight - headerHeight) / rowDensityConfig.rowHeight),
        ),
      );

      setPagination((current) =>
        current.pageSize === nextPageSize && current.pageIndex === 0
          ? current
          : {
              ...current,
              pageIndex: 0,
              pageSize: nextPageSize,
            },
      );
    }

    updateAutoPageSize();

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateAutoPageSize);
    resizeObserver?.observe(tableWrapElement);
    window.addEventListener('resize', updateAutoPageSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateAutoPageSize);
    };
  }, [autoPageSize, matchingRows.length, rowDensityConfig.rowHeight, showAllRows]);

  useEffect(() => {
    const selectedRowModels = table.getSelectedRowModel().rows;
    const selectedRowIds = selectedRowModels.map((row) => row.original.id);

    setSelectedRowsReport(selectedRowIds);
    onSelectionChange?.(
      selectedRowModels.map((row) => row.original),
      {
        ids: selectedRowIds,
        table,
      },
    );
  }, [onSelectionChange, rowSelection, selectionMode, tableData]);

  function applySearch(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setGlobalFilter(globalFilterDraft.trim());
    table.setPageIndex(0);
  }

  function clearSearch() {
    setGlobalFilterDraft('');
    setGlobalFilter('');
    table.setPageIndex(0);
  }

  useEffect(() => {
    onSearchPropsChange?.({
      appliedSearchTerm: globalFilter,
      clearSearch,
      executeSearch: applySearch,
      inputValue: globalFilterDraft,
      isSearching: false,
      setInputValue: setGlobalFilterDraft,
    });
  }, [globalFilter, globalFilterDraft, onSearchPropsChange]);

  function updateColumnFilter(columnId, value) {
    const column = table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue({
      ...getEmptyAdvancedFilterValue(),
      selectedValues: [String(value ?? '')],
    });

    column?.setFilterValue(isAdvancedFilterActive(normalizedValue) ? normalizedValue : undefined);
  }

  function updateAdvancedColumnFilter(columnId, filterValue) {
    const column = table.getColumn(columnId);
    const normalizedValue = normalizeAdvancedFilterValue(filterValue);

    column?.setFilterValue(isAdvancedFilterActive(normalizedValue) ? normalizedValue : undefined);
  }

  function clearAdvancedColumnFilter(columnId) {
    table.getColumn(columnId)?.setFilterValue(undefined);
  }

  function clearColumnFilters() {
    setColumnFilters([]);
    setOpenFilterColumnId('');
  }

  function exportFilteredRows() {
    const csvContent = buildCsvContent(visibleExportColumns, matchingRows);
    downloadCsvFile('tanstack-table-export.csv', csvContent);
  }

  function printRows(mode) {
    const printableRows =
      mode === 'selected' ? selectedRows : mode === 'all' ? matchingRows : visibleRows;

    if (printableRows.length === 0) {
      return;
    }

    const printTitle =
      mode === 'selected'
        ? 'TanStack Table - Selected Rows'
        : mode === 'all'
          ? 'TanStack Table - All Filtered Rows'
          : 'TanStack Table - Current Page';

    openPrintWindow({
      columns: visibleExportColumns,
      rows: printableRows,
      title: printTitle,
    });
  }

  function exportPdfView() {
    printRows('all');
  }

  function moveColumn(columnId, direction) {
    setColumnOrder((currentOrder) => {
      const normalizedOrder = normalizeColumnOrder(currentOrder);
      const movableColumnIds = normalizedOrder.filter((id) => id !== 'select');
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return normalizedOrder;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return ['select', ...nextOrder];
    });
  }

  function moveDraftColumn(columnId, direction) {
    setColumnSettingsDraft((currentDraft) => {
      const normalizedOrder = normalizeColumnOrder(currentDraft.columnOrder);
      const movableColumnIds = normalizedOrder.filter((id) => id !== 'select');
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return currentDraft;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return {
        ...currentDraft,
        columnOrder: ['select', ...nextOrder],
      };
    });
  }

  function reorderColumnSettings(activeColumnId, overColumnId) {
    setColumnSettingsDraft((currentDraft) => ({
      ...currentDraft,
      columnOrder: [
        'select',
        ...reorderItems(
          normalizeColumnOrder(currentDraft.columnOrder).filter((columnId) => columnId !== 'select'),
          activeColumnId,
          overColumnId,
        ),
      ],
    }));
  }

  function updateColumnWidth(columnId, width) {
    const numericWidth = Number(width);

    if (!Number.isFinite(numericWidth)) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      [columnId]: Math.max(80, numericWidth),
    }));
  }

  function updateDraftColumnWidth(columnId, width) {
    const numericWidth = Number(width);

    if (!Number.isFinite(numericWidth)) {
      return;
    }

    setColumnSettingsDraft((currentDraft) => ({
      ...currentDraft,
      columnSizing: {
        ...currentDraft.columnSizing,
        [columnId]: Math.max(80, numericWidth),
      },
    }));
  }

  function resetColumnSettings() {
    setColumnOrder(defaultColumnOrder);
    setColumnSizing(defaultColumnSizing);
    setColumnVisibility({});
  }

  function resetColumnSettingsDraft() {
    setColumnSettingsError('');
    setColumnSettingsDraft(buildColumnSettingsState());
  }

  function openColumnSettingsModal() {
    setColumnSettingsDraft(
      buildColumnSettingsState({
        columnOrder,
        columnSizing,
        columnVisibility,
      }),
    );
    setColumnSettingsError('');
    setColumnsModalOpen(true);
  }

  function cancelColumnSettings() {
    setColumnSettingsDraft(
      buildColumnSettingsState({
        columnOrder,
        columnSizing,
        columnVisibility,
      }),
    );
    setColumnSettingsError('');
    setColumnsModalOpen(false);
  }

  async function saveColumnSettings() {
    const nextColumnSettings = buildColumnSettingsState(columnSettingsDraft);
    const columnPreferencesPayload = buildColumnPreferencesPayload(nextColumnSettings);

    setColumnSettingsSaving(true);
    setColumnSettingsError('');

    try {
      await onSaveColumnPreferences({
        appId,
        gridId,
        payload: columnPreferencesPayload,
      });

      setColumnOrder(nextColumnSettings.columnOrder);
      setColumnSizing(nextColumnSettings.columnSizing);
      setColumnVisibility(nextColumnSettings.columnVisibility);
      setColumnsModalOpen(false);
    } catch (error) {
      setColumnSettingsError(error?.message || 'Failed to save column preferences.');
    } finally {
      setColumnSettingsSaving(false);
    }
  }

  function addPresentationRule() {
    const fallbackField = orderedDataColumnIds[0] ?? baseColumns[0]?.accessorKey ?? 'status';

    setPresentationRules((currentRules) => [
      ...currentRules,
      createPresentationRule({
        field: fallbackField,
      }),
    ]);
  }

  function updatePresentationRule(ruleId, patch) {
    setPresentationRules((currentRules) =>
      normalizePresentationRules(
        currentRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
      ),
    );
  }

  function deletePresentationRule(ruleId) {
    setPresentationRules((currentRules) => currentRules.filter((rule) => rule.id !== ruleId));
  }

  function reorderPresentationRules(activeRuleId, overRuleId) {
    setPresentationRules((currentRules) => reorderItems(currentRules, activeRuleId, overRuleId));
  }

  function resetPresentationRules() {
    setPresentationRules(cloneDefaultPresentationRules());
  }

  function getColumnLabel(column) {
    return typeof column?.columnDef.header === 'string' ? column.columnDef.header : column?.id;
  }

  function clampContextMenuPosition(event) {
    const menuWidth = 248;
    const menuHeight = 360;
    const x = Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12));
    const y = Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12));

    return {
      submenuPlacement: x > window.innerWidth - menuWidth * 2 - 24 ? 'left' : 'right',
      x,
      y,
    };
  }

  function openHeaderContextMenu(event, header) {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event);

    setContextMenu({
      ...position,
      columnId: header.column.id,
      label: `Column: ${getColumnLabel(header.column)}`,
      target: 'header',
    });
  }

  function openCellContextMenu(event, cell, row) {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event);

    setContextMenu({
      ...position,
      cellId: cell.id,
      columnId: cell.column.id,
      label: `${row.original.id} · ${getColumnLabel(cell.column)}`,
      rowId: row.id,
      target: 'cell',
      value: getCellValue(row, cell.column.id),
    });
  }

  function fitColumnWidth(columnId) {
    if (columnId === 'select') {
      updateColumnWidth(columnId, defaultColumnSizing.select);
      return;
    }

    const column = table.getColumn(columnId);
    const headerText = getColumnLabel(column) ?? columnId;
    const longestTextLength = tableData.reduce(
      (length, row) => Math.max(length, String(row[columnId] ?? '').length),
      String(headerText).length,
    );
    const measuredWidth = Math.min(300, Math.max(96, longestTextLength * 9 + 48));

    updateColumnWidth(columnId, measuredWidth);
  }

  function fitAllColumnWidths() {
    defaultColumnOrder.forEach((columnId) => fitColumnWidth(columnId));
  }

  function readRenderedColumnWidths() {
    const tableWrapElement = tableWrapRef.current;

    if (!tableWrapElement) {
      return {};
    }

    return Array.from(tableWrapElement.querySelectorAll('thead th[data-column-id]')).reduce(
      (widths, headerCell) => {
        const columnId = headerCell.getAttribute('data-column-id');

        if (!columnId) {
          return widths;
        }

        return {
          ...widths,
          [columnId]: Math.max(72, Math.round(headerCell.getBoundingClientRect().width)),
        };
      },
      {},
    );
  }

  function syncColumnWidthsFromDom() {
    const renderedWidths = readRenderedColumnWidths();

    if (Object.keys(renderedWidths).length === 0) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      ...renderedWidths,
    }));
  }

  function activateRow(row, event) {
    setLastDoubleClickedRow(row.original);
    onRowDoubleClick?.(row.original, { event, row, table });
  }

  function selectContextRow(rowId, replaceSelection = selectionMode === 'single') {
    if (replaceSelection) {
      setRowSelection({ [rowId]: true });
      return;
    }

    setRowSelection((currentSelection) => ({
      ...currentSelection,
      [rowId]: true,
    }));
  }

  function toggleContextRow(rowId) {
    setRowSelection((currentSelection) => {
      if (selectionMode === 'single') {
        return currentSelection[rowId] ? {} : { [rowId]: true };
      }

      const nextSelection = { ...currentSelection };

      if (nextSelection[rowId]) {
        delete nextSelection[rowId];
      } else {
        nextSelection[rowId] = true;
      }

      return nextSelection;
    });
  }

  function copyContextRow(row) {
    const content = visibleExportColumns.map((column) => buildCsvValue(row.original[column.id])).join(',');
    copyText(content);
  }

  function buildHeaderContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const canSort = column?.getCanSort();
    const sortDirection = column?.getIsSorted();
    const dataColumnIndex = orderedDataColumnIds.indexOf(menuState.columnId);
    const canMoveColumn = dataColumnIndex !== -1;

    return [
      {
        disabled: !canSort,
        key: 'sort-ascending',
        label: 'Sort ascending',
        meta: canSort && sortDirection === 'asc' ? 'Active' : '',
        onSelect: () => column?.toggleSorting(false),
      },
      {
        disabled: !canSort,
        key: 'sort-descending',
        label: 'Sort descending',
        meta: canSort && sortDirection === 'desc' ? 'Active' : '',
        onSelect: () => column?.toggleSorting(true),
      },
      {
        disabled: !sortDirection,
        key: 'clear-sort',
        label: 'Clear sort',
        onSelect: () => column?.clearSorting(),
      },
      { key: 'header-separator-1', separator: true },
      {
        disabled: !column?.getCanHide(),
        key: 'hide-column',
        label: 'Hide column',
        onSelect: () => column?.toggleVisibility(false),
      },
      {
        key: 'column-layout',
        label: 'Column layout',
        items: [
          {
            disabled: !canMoveColumn || dataColumnIndex === 0,
            key: 'move-left',
            label: 'Move left',
            onSelect: () => moveColumn(menuState.columnId, -1),
          },
          {
            disabled: !canMoveColumn || dataColumnIndex === orderedDataColumnIds.length - 1,
            key: 'move-right',
            label: 'Move right',
            onSelect: () => moveColumn(menuState.columnId, 1),
          },
          {
            key: 'fit-column',
            label: 'Auto fit this column',
            onSelect: () => fitColumnWidth(menuState.columnId),
          },
          {
            key: 'fit-all-columns',
            label: 'Auto fit all columns',
            onSelect: fitAllColumnWidths,
          },
          {
            key: 'sync-rendered-widths',
            label: 'Sync rendered widths',
            onSelect: syncColumnWidthsFromDom,
          },
          {
            key: 'reset-layout',
            label: 'Reset column layout',
            onSelect: resetColumnSettings,
          },
        ],
      },
      {
      key: 'open-column-settings',
      label: 'Open column settings',
      onSelect: openColumnSettingsModal,
    },
  ];
}

  function buildCellContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const row = visibleRows.find((visibleRow) => visibleRow.id === menuState.rowId);
    const canFilter = column?.getCanFilter();
    const isSelected = Boolean(rowSelection[menuState.rowId]);

    return [
      {
        key: 'copy-cell',
        label: 'Copy cell value',
        onSelect: () => copyText(menuState.value),
      },
      {
        disabled: !row,
        key: 'copy-row',
        label: 'Copy row values',
        onSelect: () => copyContextRow(row),
      },
      {
        disabled: !canFilter,
        key: 'filter-by-value',
        label: 'Filter by this value',
        onSelect: () => {
          updateColumnFilter(menuState.columnId, menuState.value);
          setShowFilters(true);
        },
      },
      {
        disabled: activeColumnFilters === 0 && !globalFilter,
        key: 'clear-all-filters',
        label: 'Clear all filters',
        onSelect: () => {
          clearColumnFilters();
          clearSearch();
        },
      },
      { key: 'cell-separator-1', separator: true },
      {
        key: 'row-actions',
        label: 'Row actions',
        items: [
          {
            disabled: !row,
            key: 'select-row',
            label: selectionMode === 'single' ? 'Select row' : 'Add row to selection',
            onSelect: () => selectContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'toggle-row-selection',
            label: isSelected ? 'Remove from selection' : 'Toggle row selection',
            onSelect: () => toggleContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'activate-row',
            label: 'Set as active row',
            onSelect: () => activateRow(row),
          },
          {
            disabled: !row,
            key: 'print-this-row',
            label: 'Print this row',
            onSelect: () =>
              openPrintWindow({
                columns: visibleExportColumns,
                rows: [row],
                title: `TanStack Table - ${row.original.id}`,
              }),
          },
        ],
      },
      {
        key: 'paging-actions',
        label: 'Paging',
        items: [
          {
            disabled: !table.getCanPreviousPage(),
            key: 'first-page',
            label: 'First page',
            onSelect: () => table.setPageIndex(0),
          },
          {
            disabled: !table.getCanPreviousPage(),
            key: 'previous-page',
            label: 'Previous page',
            onSelect: () => table.previousPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'next-page',
            label: 'Next page',
            onSelect: () => table.nextPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'last-page',
            label: 'Last page',
            onSelect: () => table.setPageIndex(Math.max(table.getPageCount() - 1, 0)),
          },
        ],
      },
    ];
  }

  function handleContextMenuSelect(item) {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
    setContextMenu(null);
  }

  useImperativeHandle(
    ref,
    () => ({
      getColumns: () => baseColumns,
      getGridInstance: () => table,
      getProcessedColumns: () => visibleExportColumns,
      getSelectedRows: () => table.getSelectedRowModel().rows.map((row) => row.original),
      getSelectedRowsCount: () => table.getSelectedRowModel().rows.length,
      getTableInstance: () => table,
      hasSelectedRows: () => table.getSelectedRowModel().rows.length > 0,
      printAll: () => printRows('all'),
      printCurrentPage: () => printRows('page'),
      printSelected: () => printRows('selected'),
      syncColumnWidths: syncColumnWidthsFromDom,
    }),
    [ref, table, visibleExportColumns],
  );

  const orderedDataColumnIds = normalizeColumnOrder(columnOrder).filter((columnId) => columnId !== 'select');
  const columnOptions = orderedDataColumnIds
    .map((columnId) => table.getColumn(columnId))
    .filter(Boolean)
    .map((column) => ({
      key: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
    }));
  const draftDataColumnIds = normalizeColumnOrder(columnSettingsDraft.columnOrder).filter(
    (columnId) => columnId !== 'select',
  );
  const columnSettingsOptions = draftDataColumnIds
    .map((columnId) => table.getColumn(columnId))
    .filter(Boolean)
    .map((column, index) => ({
      key: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
      checked: columnSettingsDraft.columnVisibility[column.id] !== false,
      canMoveDown: index < draftDataColumnIds.length - 1,
      canMoveUp: index > 0,
      disabled: !column.getCanHide(),
      minWidth: 80,
      onChange: (checked) =>
        setColumnSettingsDraft((currentDraft) => ({
          ...currentDraft,
          columnVisibility: {
            ...currentDraft.columnVisibility,
            [column.id]: checked,
          },
        })),
      onMoveDown: () => moveDraftColumn(column.id, 1),
      onMoveUp: () => moveDraftColumn(column.id, -1),
      onWidthChange: (width) => updateDraftColumnWidth(column.id, width),
      width: columnSettingsDraft.columnSizing[column.id] ?? column.getSize(),
    }));

  const summaryItems = [
    { label: 'Visible rows', value: visibleRows.length },
    { label: 'Matching rows', value: matchingRows.length },
    { label: 'Selected rows', value: selectedRows.length },
    { label: 'Selection callback', value: selectedRowsReport.length > 0 ? selectedRowsReport.join(', ') : 'none' },
    { label: 'Last double-click', value: lastDoubleClickedRow?.id ?? 'none' },
    { label: 'Search', value: globalFilter || 'none' },
    { label: 'Column filters', value: activeColumnFilters || 'none' },
    { label: 'Presentation rules', value: activePresentationRules || 'none' },
    { label: 'Density', value: rowDensityConfig.label },
    { label: 'Auto page size', value: autoPageSize ? `${pagination.pageSize} rows` : 'off' },
  ];

  const printMenuItems = [
    {
      key: 'current-page',
      label: 'Print current page',
      onClick: () => printRows('page'),
    },
    {
      key: 'all-filtered',
      label: 'Print all filtered rows',
      onClick: () => printRows('all'),
    },
    {
      key: 'selected',
      disabled: selectedRows.length === 0,
      label: 'Print selected rows',
      onClick: () => printRows('selected'),
    },
  ];

  const footerButtons = buildGridFooterButtons({
    filtering: showFilters,
    onColumnsSettings: openColumnSettingsModal,
    onExportExcel: exportFilteredRows,
    onExportPdf: exportPdfView,
    onPresentationSettings: () => setTemplateEditorOpen(true),
    onToggleFilter: () => setShowFilters((current) => !current),
    onToggleSummary: () => setShowSummary((current) => !current),
    footerButtons: [
      {
        component: (
          <Dropdown menu={{ items: printMenuItems }} trigger={['click']}>
            <Button aria-label="Print" icon={<PrinterOutlined />} title="Print" type="text" />
          </Dropdown>
        ),
        isCustomComponent: true,
        key: 'print',
        title: 'Print',
      },
    ],
    showColumnsSettings: true,
    showExportExcel: true,
    showExportPdf: true,
    showFilter: true,
    showPresentationSettings: true,
    presentationSettingsActive: templateEditorOpen,
    showPrint: true,
    showSummary: true,
    summaryVisible: showSummary,
  });

  const baseContextMenuItems =
    contextMenu?.target === 'header'
      ? buildHeaderContextMenuItems(contextMenu)
      : contextMenu?.target === 'cell'
        ? buildCellContextMenuItems(contextMenu)
        : [];
  const contextMenuItems = contextMenu
    ? prepareContextMenuItems(
        [
          ...baseContextMenuItems,
          ...normalizeCustomContextMenuItems(
            contextMenu.target === 'header' ? contextMenuConfig.headerItems : contextMenuConfig.cellItems,
            contextMenu,
          ),
        ],
        contextMenu,
        contextMenuConfig,
      )
    : [];
  const {
    className: tableWrapperClassName,
    style: tableWrapperStyle,
    ...resolvedTableWrapperProps
  } = tableWrapperProps;
  const { className: tableClassName, style: tableStyle, ...resolvedTableProps } = tableProps;

  return (
    <div className="tanstack-grid">
      <div className="tanstack-grid__toolbar">
        <div className="tanstack-grid__controls">
          <label className="tanstack-grid__field">
            <span>Selection mode</span>
            <select onChange={(event) => setSelectionMode(event.target.value)} value={selectionMode}>
              <option value="multi">Multi-select</option>
              <option value="single">Single-select</option>
            </select>
          </label>

          <label className="tanstack-grid__field">
            <span>Page size</span>
            <select
              disabled={showAllRows || autoPageSize}
              onChange={(event) =>
                setPagination((current) => ({
                  ...current,
                  pageIndex: 0,
                  pageSize: Number(event.target.value),
                }))
              }
              value={pagination.pageSize}
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} rows
                </option>
              ))}
            </select>
          </label>

          <label className="tanstack-grid__field">
            <span>Density</span>
            <select onChange={(event) => setRowDensity(event.target.value)} value={rowDensity}>
              {Object.entries(rowDensityConfigs).map(([densityKey, densityConfig]) => (
                <option key={densityKey} value={densityKey}>
                  {densityConfig.label}
                </option>
              ))}
            </select>
          </label>

          <label className="tanstack-grid__toggle">
            <input
              checked={showAllRows}
              onChange={(event) => setShowAllRows(event.target.checked)}
              type="checkbox"
            />
            <span>Show all filtered rows</span>
          </label>

          <label className="tanstack-grid__toggle">
            <input
              checked={autoPageSize}
              disabled={showAllRows}
              onChange={(event) => setAutoPageSize(event.target.checked)}
              type="checkbox"
            />
            <span>Auto page size</span>
          </label>
        </div>
      </div>

      <div aria-busy={loading} className="tanstack-grid__surface">
        {loading ? (
          <div className="tanstack-grid__loading-overlay" role="status">
            Loading table...
          </div>
        ) : null}

        {showFilters ? (
          <div className="tanstack-grid__inline-panel">
            <div className="tanstack-grid__filters">
              {table
                .getVisibleLeafColumns()
                .filter((column) => column.id !== 'select')
                .map((column) => (
                  <AdvancedColumnFilterButton
                    column={column}
                    isOpen={openFilterColumnId === column.id}
                    key={column.id}
                    onClear={clearAdvancedColumnFilter}
                    onClose={() => setOpenFilterColumnId('')}
                    onFilterChange={updateAdvancedColumnFilter}
                    onToggle={() =>
                      setOpenFilterColumnId((currentColumnId) => (currentColumnId === column.id ? '' : column.id))
                    }
                    rows={tableData}
                  />
                ))}

              <div className="tanstack-grid__filter-actions">
                <span className="tanstack-grid__filter-count">
                  {activeColumnFilters} active filter{activeColumnFilters === 1 ? '' : 's'}
                </span>
                <button className="tanstack-grid__button" onClick={clearColumnFilters} type="button">
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showSummary ? (
          <>
            <GridSummaryBar items={summaryItems} />
            <div className="tanstack-grid__aggregation-bar">
              <div className="tanstack-grid__aggregation-controls">
                <span>{aggregationLabels.summary}</span>
                {aggregationColumnOptions.length > 1 ? (
                  <select
                    aria-label={aggregationLabels.aggregateColumn}
                    onChange={(event) => setAggregationColumnId(event.target.value)}
                    value={selectedAggregationColumnId}
                  >
                    {aggregationColumnOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select
                  aria-label={aggregationLabels.scope}
                  onChange={(event) => setAggregationScope(event.target.value)}
                  value={aggregationScope}
                >
                  <option value="page">{aggregationLabels.page}</option>
                  <option value="filtered">{aggregationLabels.filtered}</option>
                </select>
              </div>

              <div className="tanstack-grid__aggregation-items">
                {aggregateItems.map((item) => (
                  <span className="tanstack-grid__aggregation-item" key={item.key ?? item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </span>
                ))}
                {aggregateItems.length === 0 ? (
                  <span className="tanstack-grid__aggregation-empty">No numeric columns available</span>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        <div
          {...resolvedTableWrapperProps}
          className={mergeClassNames(
            `tanstack-grid__table-wrap tanstack-grid__table-wrap--${rowDensity}`,
            tableWrapperClassName,
          )}
          ref={tableWrapRef}
          style={{
            '--tanstack-cell-padding-y': rowDensityConfig.cellPaddingY,
            '--tanstack-editor-gap': rowDensityConfig.editorGap,
            '--tanstack-editor-height': rowDensityConfig.editorHeight,
            '--tanstack-row-height': `${rowDensityConfig.rowHeight}px`,
            ...tableWrapperStyle,
          }}
        >
          <table
            {...resolvedTableProps}
            className={mergeClassNames('tanstack-grid__table', tableClassName)}
            style={{ width: table.getTotalSize(), ...tableStyle }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    const headerPresentationRule = getMatchingPresentationRule(presentationRules, {
                      columnId: header.column.id,
                      target: 'header',
                    });
                    const headerExtraProps = getResolvedProps(getHeaderProps, { header, table });
                    const {
                      className: headerClassName,
                      onContextMenu: onHeaderContextMenu,
                      style: headerStyle,
                      ...headerRestProps
                    } = headerExtraProps;

                    return (
                      <th
                        {...headerRestProps}
                        className={mergeClassNames(
                          getPresentationClassName('header', headerPresentationRule),
                          headerClassName,
                        )}
                        data-column-id={header.column.id}
                        key={header.id}
                        onContextMenu={(event) => {
                          callOptionalHandler(onHeaderContextMenu, event, { header, table });

                          if (!event.defaultPrevented) {
                            openHeaderContextMenu(event, header);
                          }
                        }}
                        style={{
                          width: header.getSize(),
                          ...getPresentationStyle(headerPresentationRule),
                          ...headerStyle,
                        }}
                        title={getPresentationTooltip(headerPresentationRule)}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            className="tanstack-grid__header-button"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            <span className="tanstack-grid__sort-indicator">
                              {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
                            </span>
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {visibleRows.length > 0 ? (
                visibleRows.map((row) => {
                  const rowPresentationRule = getMatchingPresentationRule(presentationRules, {
                    row,
                    target: 'row',
                  });
                  const rowExtraProps = getResolvedProps(getRowProps, { row, table });
                  const {
                    className: rowClassName,
                    onDoubleClick: onRowDoubleClickProp,
                    style: rowStyle,
                    ...rowRestProps
                  } = rowExtraProps;

                  return (
                    <tr
                      {...rowRestProps}
                      className={mergeClassNames(
                        row.getIsSelected() ? 'tanstack-grid__row--selected' : '',
                        lastDoubleClickedRow?.id === row.original.id ? 'tanstack-grid__row--active' : '',
                        getPresentationClassName('row', rowPresentationRule),
                        rowClassName,
                      )}
                      key={row.id}
                      onDoubleClick={(event) => {
                        callOptionalHandler(onRowDoubleClickProp, event, { row, table });

                        if (!event.defaultPrevented) {
                          activateRow(row, event);
                        }
                      }}
                      style={rowStyle}
                      title={getPresentationTooltip(rowPresentationRule)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const cellPresentationRule = getMatchingPresentationRule(presentationRules, {
                          columnId: cell.column.id,
                          row,
                          target: 'cell',
                        });
                        const rawCellValue = getCellValue(row, cell.column.id);
                        const renderedCellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
                        const cellExtraProps = getResolvedProps(getCellProps, { cell, row, table });
                        const {
                          className: cellClassName,
                          onContextMenu: onCellContextMenu,
                          style: cellStyle,
                          ...cellRestProps
                        } = cellExtraProps;

                        return (
                          <td
                            {...cellRestProps}
                            className={mergeClassNames(
                              getPresentationClassName('cell', cellPresentationRule),
                              cellClassName,
                            )}
                            key={cell.id}
                            onContextMenu={(event) => {
                              callOptionalHandler(onCellContextMenu, event, { cell, row, table });

                              if (!event.defaultPrevented) {
                                openCellContextMenu(event, cell, row);
                              }
                            }}
                            style={{
                              width: cell.column.getSize(),
                              ...getPresentationStyle(rowPresentationRule),
                              ...getPresentationStyle(cellPresentationRule),
                              ...cellStyle,
                            }}
                            title={getPresentationTooltip(cellPresentationRule) ?? getPresentationTooltip(rowPresentationRule)}
                          >
                            <div className="tanstack-grid__cell-content">
                              {renderPresentationCellContent(
                                renderedCellContent,
                                cellPresentationRule,
                                rawCellValue,
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="tanstack-grid__empty-cell" colSpan={table.getVisibleLeafColumns().length}>
                    <Empty description="No rows match the current search and filters." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <GridFooter
          attached
          buttons={footerButtons}
          currentPage={table.getState().pagination.pageIndex + 1}
          disablePaging={showAllRows}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          onNextPage={() => table.nextPage()}
          onPageSizeChange={(nextPageSize) =>
            setPagination((current) => ({
              ...current,
              pageIndex: 0,
              pageSize: nextPageSize,
            }))
          }
          onPreviousPage={() => table.previousPage()}
          pageSize={pagination.pageSize}
          pageSizeDisabled={autoPageSize}
          pageSizeOptions={pageSizeOptions}
          searchProps={{
            inputValue: globalFilterDraft,
            onInputChange: setGlobalFilterDraft,
            onSearch: applySearch,
            onClear: clearSearch,
            isSearching: false,
            placeholder: 'Search',
          }}
          total={matchingRows.length}
          totalPages={Math.max(table.getPageCount(), 1)}
        />
      </div>

      <GridColumnsModal
        columns={columnSettingsOptions}
        description="Choose visibility, order, and fixed widths for the TanStack columns. Settings persist in local storage for this preview."
        error={columnSettingsError}
        isSaving={columnSettingsSaving}
        onClose={cancelColumnSettings}
        onReorderColumns={reorderColumnSettings}
        onReset={resetColumnSettingsDraft}
        onSave={saveColumnSettings}
        open={columnsModalOpen}
      />

      <GridTemplateEditorModal
        columns={columnOptions}
        onAddRule={addPresentationRule}
        onClose={() => setTemplateEditorOpen(false)}
        onDeleteRule={deletePresentationRule}
        onReorderRules={reorderPresentationRules}
        onReset={resetPresentationRules}
        onUpdateRule={updatePresentationRule}
        open={templateEditorOpen}
        rules={presentationRules}
      />

      <ContextMenu
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
        onSelect={handleContextMenuSelect}
        state={contextMenu}
      />
    </div>
  );
});

export const TanStackTablePreview = forwardRef(function TanStackTablePreview(props, ref) {
  return (
    <TanStackTableErrorBoundary onError={props?.onError}>
      <TanStackTablePreviewContent {...props} ref={ref} />
    </TanStackTableErrorBoundary>
  );
});
