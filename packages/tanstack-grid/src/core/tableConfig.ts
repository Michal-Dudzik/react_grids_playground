export const exportableFieldIds = ['id', 'owner', 'region', 'status', 'revenue', 'updatedAt'];
export const MIN_COLUMN_WIDTH = 80;
export const pageSizeChoices = [3, 5, 8];

export const rowDensityConfigs = {
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

export const defaultAggregationLabels = {
  aggregateColumn: 'Aggregate column',
  all: 'All pages',
  average: 'Average',
  count: 'Count',
  details: 'Summary details',
  max: 'Max',
  min: 'Min',
  noAggregatableColumns: 'No columns available for summaries',
  page: 'Current page',
  scope: 'Aggregation scope',
  summary: 'Aggregates',
  sum: 'Sum',
};

export const defaultAggregationOperations = ['sum', 'average', 'min', 'max'];

export const defaultContextMenuConfig = {
  cellItems: [],
  disabledMap: {},
  headerItems: [],
  hiddenMap: {},
  labels: {},
};

export const advancedFilterOperators = [
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

export const advancedFilterOperatorsWithoutInput = new Set(['empty', 'notEmpty']);

export const defaultPresentationRules = [];

export const presentationRuleTargets = new Set(['cell', 'row', 'header']);
export const presentationRuleOperators = new Set([
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
export const presentationRuleDecorations = new Set(['success', 'warning', 'info', 'accent', 'muted']);
export const presentationRuleCellDisplays = new Set(['value', 'dot', 'check', 'cross', 'booleanIcon', 'pill']);
export const decorationAccentColors = {
  accent: 'var(--accent)',
  info: 'var(--info)',
  muted: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};
