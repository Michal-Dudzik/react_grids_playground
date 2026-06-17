import type { GridFormatMessage, GridLabels } from '../types';

export const defaultGridLabels: GridLabels = {
  active: 'Active',
  activeRow: 'Active row',
  addRowToSelection: 'Add row to selection',
  autoFitAllColumns: 'Auto fit all columns',
  autoFitThisColumn: 'Auto fit this column',
  autoPageSize: 'Auto page size',
  columnApiFallback: 'Column API fallback',
  columnFilters: 'Column filters',
  columnLayout: 'Column layout',
  columnSettings: 'Column settings',
  columnSettingsDescription: 'Choose visibility, order, and fixed widths for the TanStack columns. Settings persist in local storage for this preview.',
  columnTitlePrefix: 'Column',
  compact: 'Compact',
  comfortable: 'Comfortable',
  density: 'Density',
  editPresentation: 'Presentation settings',
  exportExcel: 'Export to Excel',
  exportPdf: 'Export PDF',
  filterByThisValue: 'Filter by this value',
  firstPage: 'First page',
  hideColumn: 'Hide column',
  hideFilters: 'Hide filters',
  hideSummary: 'Hide summary',
  lastDoubleClick: 'Last double-click',
  lastPage: 'Last page',
  loadingColumns: 'Loading columns...',
  loadingTable: 'Loading table...',
  matchingRows: 'Matching rows',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  nextPage: 'Next page',
  none: 'none',
  off: 'off',
  openColumnSettings: 'Open column settings',
  paging: 'Paging',
  presentationRules: 'Presentation rules',
  previousPage: 'Previous page',
  print: 'Print',
  printThisRow: 'Print this row',
  removeFromSelection: 'Remove from selection',
  renderingFallbackColumns: 'Rendering fallback columns.',
  resetColumnLayout: 'Reset column layout',
  rowActions: 'Row actions',
  rows: 'Rows',
  rowsSuffix: 'rows',
  search: 'Search',
  searchPlaceholder: 'Search',
  selectRow: 'Select row',
  selectedRows: 'Selected rows',
  selectionCallback: 'Selection callback',
  setAsActiveRow: 'Set as active row',
  showFilters: 'Show filters',
  showSummary: 'Show summary',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  standard: 'Standard',
  syncRenderedWidths: 'Sync rendered widths',
  visibleRows: 'Visible rows',
};

function interpolate(message: string, values?: Record<string, unknown>) {
  if (!values) {
    return message;
  }

  return Object.entries(values).reduce(
    (currentMessage, [key, value]) => currentMessage.replaceAll(`{${key}}`, String(value ?? '')),
    message,
  );
}

export function createGridMessageResolver({
  formatMessage,
  labels,
}: {
  formatMessage?: GridFormatMessage;
  labels?: Partial<GridLabels> & Record<string, string>;
} = {}) {
  return (key: keyof GridLabels | string, fallback?: string, values?: Record<string, unknown>) => {
    const defaultMessage = String(labels?.[key] ?? defaultGridLabels[key] ?? fallback ?? key);

    if (typeof formatMessage === 'function') {
      return formatMessage(
        {
          defaultMessage,
          id: `tanstackGrid.${key}`,
        },
        values,
      );
    }

    return interpolate(defaultMessage, values);
  };
}
