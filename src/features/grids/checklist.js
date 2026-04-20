export const gridChecklistSections = [
  {
    id: 'core-grid-behavior',
    title: 'Core Grid Behavior',
    items: [
      { id: 'core-local-columns', label: 'Render tabular data from local columns' },
      { id: 'core-api-columns', label: 'Render tabular data from API-fetched column definitions via appId + gridId' },
      { id: 'core-sorting', label: 'Enable sorting at grid and column level' },
      { id: 'core-excel-filter-ui', label: 'Enable Excel-style filter UI when filtering is on' },
      { id: 'core-row-selection', label: 'Support row selection' },
      { id: 'core-checkbox-selection', label: 'Support optional checkbox selection column' },
      { id: 'core-selection-modes', label: 'Support single-select and multi-select behavior' },
      { id: 'core-selected-rows-api', label: 'Expose selected rows to parent components' },
      { id: 'core-row-double-click', label: 'Support row double-click callbacks' },
      { id: 'core-inline-editing', label: 'Support inline editing on screens that enable it' },
      { id: 'core-forward-grid-props', label: 'Forward additional grid props/events to the underlying grid' },
    ],
  },
  {
    id: 'search-and-paging',
    title: 'Search and Paging',
    items: [
      { id: 'search-wrapper-search', label: 'Shared wrapper-level search, not library-native search' },
      { id: 'search-all-values', label: 'Search across configured fields or all row values' },
      { id: 'search-state-execute-clear', label: 'Manage search input state, execute search, and clear search' },
      { id: 'search-highlight', label: 'Highlight search terms in rendered cells' },
      { id: 'search-props-change', label: 'Expose search controls via onSearchPropsChange' },
      { id: 'paging-client-side', label: 'Support client-side paging' },
      { id: 'paging-page-sizes', label: 'Support configurable page sizes' },
      { id: 'paging-disable-show-all', label: 'Allow paging to be disabled to show all filtered rows' },
      { id: 'paging-auto-page-size', label: 'Auto-calculate page size from available height' },
      { id: 'paging-row-height', label: 'Support configurable row height' },
      { id: 'paging-compact-mode', label: 'Support compact / low-row-height mode' },
    ],
  },
  {
    id: 'column-management',
    title: 'Column Management',
    items: [
      { id: 'columns-local-mode', label: 'Support local column mode' },
      { id: 'columns-api-mode', label: 'Support API-backed column mode via appId and gridId' },
      { id: 'columns-user-config', label: 'Fetch user-specific column configuration from API' },
      { id: 'columns-persist-order', label: 'Persist column order to API' },
      { id: 'columns-persist-visibility', label: 'Persist column visibility to API' },
      { id: 'columns-persist-width', label: 'Persist column width to API' },
      { id: 'columns-reset-defaults', label: 'Reset column configuration to defaults' },
      { id: 'columns-settings-modal', label: 'Provide a column settings modal' },
      { id: 'columns-settings-reorder', label: 'Allow drag-and-drop reorder inside column settings' },
      { id: 'columns-settings-width-edit', label: 'Allow width editing inside column settings' },
      { id: 'columns-settings-visibility', label: 'Allow visibility toggling inside column settings' },
      { id: 'columns-settings-sync-widths', label: 'Sync widths from the live rendered grid DOM' },
    ],
  },
  {
    id: 'templates-and-custom-rendering',
    title: 'Templates and Custom Rendering',
    items: [
      { id: 'templates-rule-based', label: 'Apply templates to columns from rules' },
      { id: 'templates-dynamic-api-columns', label: 'Apply template rules to dynamically loaded API columns' },
      { id: 'templates-built-in-reusable', label: 'Provide reusable built-in templates for common data presentation' },
      { id: 'templates-search-highlight', label: 'Inject search highlight template behavior' },
      { id: 'templates-custom-react', label: 'Render custom React content inside cells' },
      { id: 'templates-match-metadata', label: 'Match templates by field name, data type, or custom metadata' },
      { id: 'templates-correction-layouts', label: 'Support correction / before-after layouts' },
      { id: 'templates-status-rendering', label: 'Support boolean / status-style template rendering' },
    ],
  },
  {
    id: 'presentation-rules',
    title: 'Presentation Rules',
    items: [
      { id: 'presentation-user-editable', label: 'Allow user-editable presentation rules per grid' },
      { id: 'presentation-editor-modal', label: 'Provide a presentation editor modal' },
      { id: 'presentation-rule-template', label: 'Support template presentation rules' },
      { id: 'presentation-rule-decoration', label: 'Support decoration presentation rules' },
      { id: 'presentation-target-cell', label: 'Target cells with presentation rules' },
      { id: 'presentation-target-row', label: 'Target rows with presentation rules' },
      { id: 'presentation-target-header', label: 'Target headers with presentation rules' },
      { id: 'presentation-condition-operators', label: 'Support the shared condition operators set' },
      { id: 'presentation-priority', label: 'Support rule priority ordering' },
      { id: 'presentation-merge-default-user', label: 'Merge default rules with user-saved rules' },
      { id: 'presentation-local-storage', label: 'Persist presentation config in local storage' },
    ],
  },
  {
    id: 'decorations-and-conditional-styling',
    title: 'Decorations and Conditional Styling',
    items: [
      { id: 'decorations-row-style', label: 'Support row-level class/style decoration' },
      { id: 'decorations-cell-style', label: 'Support cell-level class/style decoration' },
      { id: 'decorations-header-style', label: 'Support header-level decoration' },
      { id: 'decorations-cell-icon', label: 'Support cell icon decoration' },
      { id: 'decorations-cell-tooltip', label: 'Support cell tooltip decoration' },
      { id: 'decorations-unified-rules', label: 'Unify code-defined rules with saved presentation rules' },
    ],
  },
  {
    id: 'aggregation-and-summary',
    title: 'Aggregation / Summary Behavior',
    items: [
      { id: 'aggregation-custom-bar', label: 'Provide a custom aggregation bar outside the main grid body' },
      { id: 'aggregation-footer-toggle', label: 'Provide an aggregate toggle in the shared footer' },
      { id: 'aggregation-current-page', label: 'Compute aggregates for the current page' },
      { id: 'aggregation-full-filtered', label: 'Compute aggregates for the full filtered dataset' },
      { id: 'aggregation-supported-types', label: 'Support sum, avg, min, max, and custom aggregates' },
      { id: 'aggregation-auto-detect', label: 'Automatically detect likely aggregatable columns' },
      { id: 'aggregation-config', label: 'Support explicit aggregationConfig' },
      { id: 'aggregation-width-sync', label: 'Synchronize widths between the grid and aggregation bar' },
      { id: 'aggregation-scroll-sync', label: 'Synchronize scrolling between the grid and aggregation bar' },
      { id: 'aggregation-localized-labels', label: 'Localize aggregation labels and tooltips' },
      { id: 'aggregation-responsive-formatting', label: 'Keep aggregates responsive with number formatting' },
    ],
  },
  {
    id: 'context-menu',
    title: 'Context Menu',
    items: [
      { id: 'context-built-in-items', label: 'Support the shared built-in context menu items set' },
      { id: 'context-custom-items', label: 'Support custom context menu items' },
      { id: 'context-submenus', label: 'Support nested / submenu context menu items' },
      { id: 'context-localized-labels', label: 'Localize context menu labels' },
      { id: 'context-targeted-area', label: 'Target context menu items by grid area' },
      { id: 'context-dynamic-hide', label: 'Apply dynamic hide/show rules' },
      { id: 'context-dynamic-disable', label: 'Apply dynamic disabled rules' },
      { id: 'context-action-dispatch', label: 'Dispatch actions for custom context menu items' },
      { id: 'context-disabled-dom', label: 'Enforce disabled state in the rendered menu DOM' },
    ],
  },
  {
    id: 'export-and-print',
    title: 'Export and Print',
    items: [
      { id: 'export-excel-footer', label: 'Export to Excel from the shared footer' },
      { id: 'export-print-dropdown', label: 'Provide a print dropdown in the shared footer' },
      { id: 'print-all-rows', label: 'Print all rows' },
      { id: 'print-current-page', label: 'Print the current page' },
      { id: 'print-selected-rows', label: 'Print selected rows' },
      { id: 'print-selection-aware', label: 'Disable print options based on selection state' },
      { id: 'print-custom-pipeline', label: 'Use the custom print pipeline with processed columns and measured widths' },
    ],
  },
  {
    id: 'footer-and-integration',
    title: 'Footer and Integration Features',
    items: [
      { id: 'footer-shared-footer', label: 'Provide the shared footer wrapper' },
      { id: 'footer-search-ui', label: 'Expose search UI in the shared footer' },
      { id: 'footer-paging-controls', label: 'Expose paging controls in the shared footer' },
      { id: 'footer-filter-toggle', label: 'Expose a filter toggle in the shared footer' },
      { id: 'footer-aggregation-toggle', label: 'Expose an aggregation toggle in the shared footer' },
      { id: 'footer-print-actions', label: 'Expose print actions in the shared footer' },
      { id: 'footer-excel-export', label: 'Expose Excel export in the shared footer' },
      { id: 'footer-column-settings', label: 'Expose column settings in the shared footer' },
      { id: 'footer-presentation-settings', label: 'Expose presentation settings in the shared footer' },
      { id: 'footer-custom-buttons', label: 'Support custom injected footer buttons' },
      { id: 'footer-custom-components', label: 'Support custom injected footer components' },
      { id: 'footer-selection-count', label: 'Pass selection count into footer actions' },
    ],
  },
  {
    id: 'state-persistence-and-ux',
    title: 'State, Persistence, and UX',
    items: [
      { id: 'ux-loading-overlay', label: 'Show a loading overlay while data or columns are not ready' },
      { id: 'ux-error-boundary', label: 'Wrap the grid in an error boundary' },
      { id: 'ux-filter-state-key', label: 'Store filter state per grid key' },
      { id: 'ux-presentation-state-key', label: 'Store presentation state per grid key' },
      { id: 'ux-locale-sensitive', label: 'Handle locale-sensitive column loading and labels' },
      { id: 'ux-ref-grid-instance', label: 'Expose imperative access to the grid instance' },
      { id: 'ux-ref-selected-rows', label: 'Expose imperative access to selected rows' },
      { id: 'ux-ref-processed-columns', label: 'Expose imperative access to processed columns' },
      { id: 'ux-ref-print-methods', label: 'Expose imperative print methods for all/current/selected rows' },
      { id: 'ux-ref-selected-row-count', label: 'Expose imperative selected row count' },
      { id: 'ux-ref-selected-row-presence', label: 'Expose imperative selected row presence' },
    ],
  },
];

export const gridChecklistItems = gridChecklistSections.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    sectionId: section.id,
    sectionTitle: section.title,
  })),
);

export function buildGridChecklist({ notes = {}, summary = '', supported = [] } = {}) {
  const supportedIds = new Set(supported);

  return {
    summary,
    items: Object.fromEntries(
      gridChecklistItems.map((item) => [
        item.id,
        {
          checked: supportedIds.has(item.id),
          note: notes[item.id] ?? '',
        },
      ]),
    ),
  };
}

export function getChecklistTotals(checklist) {
  const checked = gridChecklistItems.filter((item) => checklist.items[item.id]?.checked).length;

  return {
    checked,
    missing: gridChecklistItems.length - checked,
    total: gridChecklistItems.length,
  };
}

export function getChecklistSectionTotals(checklist, section) {
  const checked = section.items.filter((item) => checklist.items[item.id]?.checked).length;

  return {
    checked,
    missing: section.items.length - checked,
    total: section.items.length,
  };
}
