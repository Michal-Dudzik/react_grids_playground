import { buildGridChecklist } from './checklist';
import { mantineFeature } from './mantine/feature';
import { primeReactFeature } from './primeReact/feature';
import { reactDataGridFeature } from './reactDataGrid/feature';
import { tanStackTableFeature } from './tanStackTable/feature';
import { toolboxJsFeature } from './toolboxJs/feature';

function buildGroupedNotes(groups) {
  return Object.fromEntries(
    groups.flatMap(([note, ids]) => ids.map((id) => [id, note])),
  );
}

export const gridFeatures = [
  {
    ...tanStackTableFeature,
    checklist: buildGridChecklist({
      summary:
        'The TanStack preview now covers the core local-wrapper slice: sorting, editable cells, row selection, selected-row callback state, row double-click feedback, shared footer search, inline column filters, client-side paging, search highlighting, local column visibility/order/width controls, resettable column settings, summary metrics, local presentation/decorator rules, revenue aggregation, targeted header/cell context menus, CSV export, and browser-based print/PDF flows. API-backed columns, API persistence, template presentation rules, localization, dynamic hide/show context rules, and imperative wrapper refs still require custom wrapper code.',
      supported: [
        'core-local-columns',
        'core-sorting',
        'core-row-selection',
        'core-checkbox-selection',
        'core-selection-modes',
        'core-selected-rows-api',
        'core-row-double-click',
        'core-inline-editing',
        'search-wrapper-search',
        'search-all-values',
        'search-state-execute-clear',
        'search-highlight',
        'paging-client-side',
        'paging-page-sizes',
        'paging-disable-show-all',
        'columns-local-mode',
        'columns-reset-defaults',
        'columns-settings-modal',
        'columns-settings-width-edit',
        'columns-settings-visibility',
        'templates-search-highlight',
        'templates-custom-react',
        'templates-status-rendering',
        'presentation-user-editable',
        'presentation-editor-modal',
        'presentation-rule-decoration',
        'presentation-target-cell',
        'presentation-target-row',
        'presentation-target-header',
        'presentation-condition-operators',
        'presentation-priority',
        'presentation-local-storage',
        'decorations-row-style',
        'decorations-cell-style',
        'decorations-header-style',
        'decorations-cell-icon',
        'decorations-cell-tooltip',
        'decorations-unified-rules',
        'aggregation-custom-bar',
        'aggregation-footer-toggle',
        'aggregation-current-page',
        'aggregation-full-filtered',
        'aggregation-supported-types',
        'aggregation-responsive-formatting',
        'context-built-in-items',
        'context-custom-items',
        'context-submenus',
        'context-targeted-area',
        'context-dynamic-disable',
        'context-action-dispatch',
        'context-disabled-dom',
        'export-excel-footer',
        'export-print-dropdown',
        'print-all-rows',
        'print-current-page',
        'print-selected-rows',
        'print-selection-aware',
        'footer-shared-footer',
        'footer-search-ui',
        'footer-paging-controls',
        'footer-filter-toggle',
        'footer-aggregation-toggle',
        'footer-print-actions',
        'footer-excel-export',
        'footer-column-settings',
        'footer-presentation-settings',
        'footer-custom-buttons',
        'footer-custom-components',
        'footer-selection-count',
        'ux-presentation-state-key',
      ],
      notes: buildGroupedNotes([
        ['Sorting is wired through TanStack sorting state in the preview table.', ['core-sorting']],
        [
          'TanStack rowSelection state powers the selection column, and the preview can switch between checkbox multi-select and radio single-select.',
          ['core-row-selection', 'core-checkbox-selection', 'core-selection-modes'],
        ],
        [
          'The preview uses TanStack global filtering across the leaf columns with explicit apply and clear controls.',
          ['search-all-values', 'search-state-execute-clear'],
        ],
        [
          'Global search terms are highlighted in rendered text cells and inside the shared status badge template.',
          ['search-highlight', 'templates-search-highlight'],
        ],
        [
          'Client-side pagination uses TanStack pagination state, and the preview can bypass pagination to show every filtered row.',
          ['paging-client-side', 'paging-page-sizes', 'paging-disable-show-all'],
        ],
        [
          'The shared column modal now drives TanStack column visibility, fixed column widths, reset-to-default behavior, and local-storage state for this preview.',
          ['columns-settings-modal', 'columns-settings-visibility', 'columns-settings-width-edit', 'columns-reset-defaults'],
        ],
        ['Status cells render through a custom React component.', ['templates-custom-react', 'templates-status-rendering']],
        [
          'Requires a custom wrapper/data layer to fetch localized column definitions and user preferences via appId + gridId.',
          ['core-api-columns', 'columns-api-mode', 'columns-user-config', 'ux-locale-sensitive'],
        ],
        [
          'Search now runs through shared footer/search wrapper components rather than TanStack-specific UI. Exposing the search state outward with onSearchPropsChange is still wrapper work.',
          ['search-wrapper-search', 'footer-search-ui'],
        ],
        [
          'The shared ANTD footer shell now hosts paging and action buttons for TanStack. That button/component contract can be reused by other grids.',
          ['footer-shared-footer', 'footer-paging-controls', 'footer-custom-buttons', 'footer-custom-components'],
        ],
        [
          'Column visibility, width editing, local ordering, and reset are exposed through the shared footer action. API persistence and drag-and-drop ordering are still wrapper work.',
          ['footer-column-settings'],
        ],
        [
          'TanStack now has a shared footer filter toggle plus inline per-column filter controls, but the Syncfusion-style Excel menu UI and persisted filter keys are still wrapper work.',
          ['core-excel-filter-ui', 'footer-filter-toggle', 'ux-filter-state-key'],
        ],
        [
          'The preview mirrors TanStack selected row models into callback-style state and surfaces the selection count in the footer.',
          ['core-selected-rows-api', 'footer-selection-count'],
        ],
        [
          'Rows expose double-click handling through wrapper DOM events and display the last activated row in the summary state.',
          ['core-row-double-click'],
        ],
        [
          'Editable text/select cells update local TanStack data through table meta. Validation and commit/cancel workflows would still be wrapper-owned.',
          ['core-inline-editing'],
        ],
        [
          'Imperative selected-row refs still need a wrapper ref API around the TanStack instance.',
          ['ux-ref-selected-rows', 'ux-ref-selected-row-count', 'ux-ref-selected-row-presence'],
        ],
        [
          'Forwarded events, imperative table handles, processed columns, and print methods belong to the custom wrapper API surface.',
          ['core-forward-grid-props', 'ux-ref-grid-instance', 'ux-ref-processed-columns', 'ux-ref-print-methods'],
        ],
        [
          'Auto page sizing, row density, row height, and the shared footer pager depend on custom layout and styling wrappers.',
          ['paging-auto-page-size', 'paging-row-height', 'paging-compact-mode', 'footer-paging-controls'],
        ],
        [
          'TanStack column order, visibility, and sizing primitives are wired into the modal for this preview, including local-storage persistence. API persistence, drag-and-drop reorder, and DOM width sync remain wrapper responsibilities.',
          [
            'columns-persist-order',
            'columns-persist-visibility',
            'columns-persist-width',
            'columns-reset-defaults',
            'columns-settings-modal',
            'columns-settings-reorder',
            'columns-settings-width-edit',
            'columns-settings-sync-widths',
            'footer-column-settings',
          ],
        ],
        [
          'Rule-driven template matching, reusable template registries, correction layouts, and API-column template application require a custom wrapper layer on top of headless cells.',
          [
            'templates-rule-based',
            'templates-dynamic-api-columns',
            'templates-built-in-reusable',
            'templates-match-metadata',
            'templates-correction-layouts',
          ],
        ],
        [
          'The footer presentation button now opens a local rule editor with enabled rules, target selection, condition operators, custom text/background colors, cell display replacement, drag-and-drop rule ordering, local-storage persistence, and cell/row/header decoration application.',
          [
            'presentation-user-editable',
            'presentation-editor-modal',
            'presentation-rule-decoration',
            'presentation-target-cell',
            'presentation-target-row',
            'presentation-target-header',
            'presentation-condition-operators',
            'presentation-priority',
            'presentation-local-storage',
            'footer-presentation-settings',
            'ux-presentation-state-key',
          ],
        ],
        [
          'Template-rendering rules, default/user merge semantics, and API-backed presentation persistence are still wrapper work.',
          ['presentation-rule-template', 'presentation-merge-default-user'],
        ],
        [
          'The same rule pipeline applies row, cell, and header styles; decorated cells can keep an indicator or replace the value with a dot, check, cross, boolean icon, or compact pill.',
          [
            'decorations-row-style',
            'decorations-cell-style',
            'decorations-header-style',
            'decorations-cell-icon',
            'decorations-cell-tooltip',
            'decorations-unified-rules',
          ],
        ],
        [
          'The shared summary toggle now reveals a custom revenue aggregation bar with current-page versus full-filtered scope and sum, avg, min, and max values.',
          [
            'aggregation-custom-bar',
            'aggregation-footer-toggle',
            'aggregation-current-page',
            'aggregation-full-filtered',
            'aggregation-supported-types',
            'aggregation-responsive-formatting',
            'footer-aggregation-toggle',
          ],
        ],
        [
          'Aggregate auto-detection, explicit config, localized aggregate labels, and width/scroll synchronization still need wrapper work.',
          [
            'aggregation-auto-detect',
            'aggregation-config',
            'aggregation-width-sync',
            'aggregation-scroll-sync',
            'aggregation-localized-labels',
          ],
        ],
        [
          'TanStack now has a wrapper-rendered context menu with separate header and cell targets, submenu groups, disabled states, and action dispatch for sorting, layout, copy, filter, row, print, and paging actions.',
          [
            'context-built-in-items',
            'context-custom-items',
            'context-submenus',
            'context-targeted-area',
            'context-dynamic-disable',
            'context-action-dispatch',
            'context-disabled-dom',
          ],
        ],
        [
          'Localized context menu labels and configurable hide/show rules still need a wrapper menu configuration contract.',
          ['context-localized-labels', 'context-dynamic-hide'],
        ],
        [
          'The shared footer now exports the filtered dataset as CSV for Excel and exposes a print dropdown for current-page, filtered, and selected-row print flows. A richer measured-width print/export pipeline is still wrapper work.',
          [
            'export-excel-footer',
            'export-print-dropdown',
            'print-all-rows',
            'print-current-page',
            'print-selected-rows',
            'print-selection-aware',
            'print-custom-pipeline',
            'footer-print-actions',
            'footer-excel-export',
          ],
        ],
        [
          'The shared footer now carries search, paging, filter, aggregate visibility, export, print, column settings, presentation settings, and selected-row count, while still leaving broader wrapper composition concerns open.',
          [
            'footer-shared-footer',
            'footer-custom-buttons',
            'footer-custom-components',
            'footer-print-actions',
            'footer-excel-export',
            'footer-aggregation-toggle',
            'footer-presentation-settings',
            'footer-selection-count',
          ],
        ],
        [
          'Loading overlays and error boundaries live in the wrapper shell, not the TanStack table instance itself.',
          ['ux-loading-overlay', 'ux-error-boundary'],
        ],
      ]),
    }),
  },
  {
    ...reactDataGridFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline covers local columns, sorting, and custom React cell rendering. The demo also has resizable columns and a frozen first column outside the shared checklist.',
      supported: [
        'core-local-columns',
        'core-sorting',
        'columns-local-mode',
        'templates-custom-react',
        'templates-status-rendering',
      ],
      notes: {
        'core-sorting': 'Columns are sortable through defaultColumnOptions and per-column config.',
        'columns-local-mode': 'The current preview is configured from a local columns array.',
      },
    }),
  },
  {
    ...toolboxJsFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline only covers local columns and sortable headers. No shared wrapper behaviors or custom render pipeline are in place yet.',
      supported: ['core-local-columns', 'core-sorting', 'columns-local-mode'],
      notes: {
        'core-sorting': 'Sortable headers are enabled through the Toolbox grid column config.',
      },
    }),
  },
  {
    ...primeReactFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline covers local columns, sorting, and custom React cell rendering. Shared wrapper behaviors like search, persistence, footer actions, and print/export still need implementation.',
      supported: [
        'core-local-columns',
        'core-sorting',
        'columns-local-mode',
        'templates-custom-react',
        'templates-status-rendering',
      ],
      notes: {
        'core-sorting': 'PrimeReact sortable columns are enabled on each preview column.',
        'templates-custom-react': 'The status column uses a custom body renderer.',
      },
    }),
  },
  {
    ...mantineFeature,
    checklist: buildGridChecklist({
      summary:
        'Current baseline is mostly presentational: local columns plus custom React status rendering. Sorting, selection, paging, and wrapper-level integration still need to be added.',
      supported: ['core-local-columns', 'columns-local-mode', 'templates-custom-react', 'templates-status-rendering'],
      notes: {
        'templates-custom-react': 'The status column uses a custom render function.',
      },
    }),
  },
];
