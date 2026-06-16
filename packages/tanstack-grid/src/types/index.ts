import type { ColumnDef, RowData, Table, VisibilityState } from '@tanstack/react-table';
import type { CSSProperties, HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';
import type { AggregationConfig } from '../core/tableAggregation';
import type { GridStateAdapter } from '../adapters/browser';

export type { GridStateAdapter } from '../adapters/browser';

export type GridColumnDef<Row extends RowData = RowData> = ColumnDef<Row> & {
  /** Grid input field name; mapped to TanStack's `accessorKey` when building table columns. */
  field?: keyof Row | string;
  alias?: string;
  headerText?: string;
  description?: string;
  width?: number;
  visible?: boolean;
  allowFiltering?: boolean;
  allowSorting?: boolean;
  allowEditing?: boolean;
  readOnly?: boolean;
};

export interface GridFeatureFlags {
  columnSettings?: boolean;
  contextMenu?: boolean;
  export?: boolean;
  filtering?: boolean;
  pagination?: boolean;
  presentation?: boolean;
  print?: boolean;
  selection?: boolean;
  summary?: boolean;
}

export interface GridPresentationRule {
  id: string;
  name: string;
  enabled?: boolean;
  target: 'cell' | 'row' | 'header';
  field: string;
  operator: string;
  value?: string;
  decoration?: string;
  backgroundColor?: string;
  cellDisplay?: string;
  textColor?: string;
}

export interface GridColumnPreferencesAdapter {
  load?: (context?: Record<string, unknown>) => Promise<unknown[]>;
  save?: (context: { payload: unknown } & Record<string, unknown>) => Promise<unknown>;
}

export interface GridExportAdapter {
  downloadCsvFile?: (fileName: string, content: string) => void;
}

export interface GridPrintAdapter {
  openPrintWindow?: (options: { columns: unknown[]; rows: unknown[]; title: string }) => void;
}

export interface GridClipboardAdapter {
  copyText?: (value: unknown) => void;
}

export interface GridSlots<Row extends RowData = RowData> {
  cellRenderers?: Record<string, (context: GridCellPreviewContext<Row>) => ReactNode>;
  cellPreviewRenderers?: Record<string, (context: GridCellPreviewContext<Row>) => ReactNode>;
  renderCellPreview?: (context: GridCellPreviewContext<Row>) => ReactNode;
}

export interface GridCellPreviewContext<Row extends RowData = RowData> {
  column: GridColumnDef<Row>;
  columnId: string;
  renderHighlightedText: (value: unknown, searchTerm?: string) => ReactNode;
  searchTerm?: string;
  value: unknown;
}

export interface TanStackGridRef<Row extends RowData = RowData> {
  getActiveRow: () => Row | null;
  getColumns: () => GridColumnDef<Row>[];
  getProcessedColumns: () => unknown[];
  getSelectedRows: () => Row[];
  getSelectedRowsCount: () => number;
  getTableInstance: () => Table<Row>;
  hasSelectedRows: () => boolean;
  printAll: () => void;
  printCurrentPage: () => void;
  printSelected: () => void;
  setActiveRow: (rowId: string) => void;
  syncColumnWidths: () => void;
}

export interface TanStackGridProps<Row extends RowData = RowData> {
  rows?: Row[];
  columns?: GridColumnDef<Row>[];
  aggregationConfig?: AggregationConfig;
  appId?: string;
  autoPageSize?: boolean;
  columnRequest?: typeof fetch;
  contextMenuConfig?: Record<string, unknown>;
  defaultColumns?: GridColumnDef<Row>[];
  editingEnabled?: boolean;
  enableAltRow?: boolean;
  fetchColumns?: boolean | GridColumnPreferencesAdapter['load'];
  getCellProps?: (context: Record<string, unknown>) => Record<string, unknown>;
  getHeaderProps?: (context: Record<string, unknown>) => Record<string, unknown>;
  getRowProps?: (context: Record<string, unknown>) => Record<string, unknown>;
  gridId?: string;
  initialAutoPageSize?: boolean;
  initialEditingEnabled?: boolean;
  initialPageSize?: number;
  initialRowDensity?: string;
  initialSelectionMode?: string;
  initialShowAllRows?: boolean;
  loading?: boolean;
  locale?: string;
  onAutoPageSizeChange?: (enabled: boolean) => void;
  onEditingEnabledChange?: (enabled: boolean) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSaveColumnPreferences?: GridColumnPreferencesAdapter['save'];
  onSearchPropsChange?: (props: Record<string, unknown>) => void;
  onRowDensityChange?: (density: string) => void;
  onSelectionModeChange?: (mode: string) => void;
  onShowAllRowsChange?: (showAll: boolean) => void;
  pageSize?: number;
  rowDensity?: string;
  selectionMode?: string;
  showAllRows?: boolean;
  showColumnDividers?: boolean;
  showRowDividers?: boolean;
  tableProps?: TableHTMLAttributes<HTMLTableElement>;
  tableWrapperProps?: HTMLAttributes<HTMLDivElement>;
  transformColumnsFn?: (columns: ColumnDef<Row>[]) => ColumnDef<Row>[];
  getRowId?: (row: Row) => string;
  features?: GridFeatureFlags;
  persistence?: {
    columnState?: GridStateAdapter;
    filterState?: GridStateAdapter;
    presentationRules?: GridStateAdapter<GridPresentationRule[]>;
  };
  columnPreferences?: GridColumnPreferencesAdapter;
  slots?: GridSlots<Row>;
  initialState?: {
    autoPageSize?: boolean;
    editingEnabled?: boolean;
    pageSize?: number;
    rowDensity?: string;
    showAllRows?: boolean;
  };
  controlledState?: {
    autoPageSize?: boolean;
    editingEnabled?: boolean;
    pageSize?: number;
    rowDensity?: string;
    selectionMode?: string;
    showAllRows?: boolean;
  };
  clipboardAdapter?: GridClipboardAdapter;
  exportAdapter?: GridExportAdapter;
  printAdapter?: GridPrintAdapter;
  onSelectionChange?: (rows: Row[], context: { ids: Array<string | number>; table: Table<Row> }) => void;
  onRowActivate?: (row: Row, context: Record<string, unknown>) => void;
  onRowDoubleClick?: (row: Row, context: Record<string, unknown>) => void;
  onError?: (error: Error, errorInfo: unknown) => void;
}
