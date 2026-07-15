import type { ColumnDef, RowData, Table, VisibilityState } from '@tanstack/react-table';
import type { ComponentType, CSSProperties, HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';
import type { AggregationConfig } from '../core/tableAggregation';
import type { GridStateAdapter } from '../adapters/browser';

export type { GridStateAdapter } from '../adapters/browser';

export type GridColumnDef<Row extends RowData = RowData> = Partial<ColumnDef<Row>> & {
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

export interface GridMessageDescriptor {
  defaultMessage: string;
  id: string;
}

export type GridFormatMessage = (
  descriptor: GridMessageDescriptor,
  values?: Record<string, unknown>,
) => string;

export interface GridLabels {
  [key: string]: string;
}

export type GridInstanceId = string | number;

export interface GridThemeTokens {
  accent?: string;
  accentSoft?: string;
  accentStrong?: string;
  background?: string;
  border?: string;
  borderStrong?: string;
  danger?: string;
  info?: string;
  rowAltBackground?: string;
  shadow?: string;
  success?: string;
  surface?: string;
  surfaceMuted?: string;
  text?: string;
  textMuted?: string;
  warning?: string;
}

export interface GridSpinnerProps {
  label?: ReactNode;
  size?: 'small' | 'default' | 'large';
}

export interface GridLoadingOverlayProps {
  label?: ReactNode;
  Spinner?: ComponentType<GridSpinnerProps>;
}

export interface GridModalProps {
  centered?: boolean;
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
  onClose?: () => void;
  open: boolean;
  title?: ReactNode;
  width?: number | string;
}

export interface GridErrorPanelProps {
  className?: string;
  description?: ReactNode;
  message?: ReactNode;
  type?: 'error' | 'warning';
}

export interface GridEmptyStateProps {
  description?: ReactNode;
}

export interface GridComponents {
  EmptyState?: ComponentType<GridEmptyStateProps>;
  ErrorPanel?: ComponentType<GridErrorPanelProps>;
  LoadingOverlay?: ComponentType<GridLoadingOverlayProps>;
  Modal?: ComponentType<GridModalProps>;
  Spinner?: ComponentType<GridSpinnerProps>;
}

export interface GridFooterButtonConfig {
  key?: string;
  className?: string;
  component?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  isCustomComponent?: boolean;
  label?: string;
  loading?: boolean;
  onClick?: () => void;
  title?: string;
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
}

export interface GridFooterConfig {
  buttons?: GridFooterButtonConfig[];
  hidePageCount?: boolean;
  showColumnsSettings?: boolean;
  showExportExcel?: boolean;
  showExportPdf?: boolean;
  showFilter?: boolean;
  showFooter?: boolean;
  showPresentationSettings?: boolean;
  showPrint?: boolean;
  showSummary?: boolean;
}

export interface SyncfusionTemplateRuleCompat {
  match?: (column: unknown) => boolean;
  template?: ReactNode | ((props: Record<string, unknown>) => ReactNode);
}

export interface SyncfusionContextMenuItemCompat {
  action?: (context: Record<string, unknown>) => void;
  disabled?: boolean | ((context: Record<string, unknown>) => boolean);
  hidden?: boolean | ((context: Record<string, unknown>) => boolean);
  iconCss?: string;
  id?: string;
  items?: SyncfusionContextMenuItemCompat[];
  key?: string;
  label?: string;
  meta?: string;
  separator?: boolean;
  target?: string;
  text?: string;
}

export interface SyncfusionContextMenuCompat {
  contextMenuItems?: Array<string | SyncfusionContextMenuItemCompat>;
  disabledMap?: Record<string, unknown>;
  hiddenMap?: Record<string, unknown>;
  items?: Array<string | SyncfusionContextMenuItemCompat>;
  onContextMenuClick?: (args: Record<string, unknown>) => void;
}

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

export interface GridDefaults {
  features?: GridFeatureFlags;
  footerConfig?: GridFooterConfig;
  initialAutoPageSize?: boolean;
  initialEditingEnabled?: boolean;
  initialPageSize?: number;
  initialRowDensity?: string;
  initialSelectionMode?: string;
  initialShowAllRows?: boolean;
}

export interface GridProviderValue {
  columnPreferences?: GridColumnPreferencesAdapter;
  components?: GridComponents;
  defaults?: GridDefaults;
  formatMessage?: GridFormatMessage;
  labels?: Partial<GridLabels> & Record<string, string>;
  locale?: string;
  themeTokens?: GridThemeTokens;
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

export interface GridColumnPreferencesContext extends Record<string, unknown> {
  appId?: GridInstanceId;
  gridId?: GridInstanceId;
  languageCode?: string;
  signal?: AbortSignal;
}

export interface GridColumnPreferencesAdapter {
  load?: (context?: GridColumnPreferencesContext) => Promise<unknown>;
  reset?: (context?: GridColumnPreferencesContext) => Promise<unknown>;
  save?: (context: GridColumnPreferencesContext & { payload: unknown }) => Promise<unknown>;
}

export interface GridExportAdapter {
  downloadCsvFile?: (fileName: string, content: string) => void;
  downloadXlsxFile?: (fileName: string, content: Uint8Array) => void;
}

export interface GridPrintAdapter {
  openPrintWindow?: (options: { columns: unknown[]; rows: unknown[]; title: string }) => void;
}

export interface GridClipboardAdapter {
  copyText?: (value: unknown) => void;
}

export interface GridSlots<Row extends RowData = RowData> {
  cellRenderers?: Record<string, GridCellRenderer<Row>>;
  cellPreviewRenderers?: Record<string, GridCellRenderer<Row>>;
  renderCellPreview?: GridCellRenderer<Row>;
}

export type GridCellRenderer<Row extends RowData = RowData> = (context: GridCellPreviewContext<Row>) => ReactNode;

export interface GridCellPreviewContext<Row extends RowData = RowData> {
  column: GridColumnDef<Row>;
  columnId: string;
  renderHighlightedText: (value: unknown, searchTerm?: string) => ReactNode;
  row?: Row;
  searchTerm?: string;
  value: unknown;
}

export interface GridContextMenuState<Row extends RowData = RowData> {
  cellId?: string;
  columnId?: string;
  displayValue?: unknown;
  row?: Row;
  rowId?: string;
  target: 'cell' | 'header';
  value?: unknown;
}

export interface GridContextMenuItem<Row extends RowData = RowData> {
  disabled?: boolean;
  icon?: ReactNode;
  items?: GridContextMenuItem<Row>[];
  key: string;
  label: ReactNode;
  meta?: ReactNode;
  onSelect?: (context: GridContextMenuState<Row>) => void;
  separator?: boolean;
}

export type GridContextMenuItems<Row extends RowData = RowData> =
  | GridContextMenuItem<Row>[]
  | ((context: GridContextMenuState<Row>) => GridContextMenuItem<Row>[]);

export interface GridContextMenuConfig<Row extends RowData = RowData> {
  cellItems?: GridContextMenuItems<Row>;
  disabledMap?: Record<string, boolean | ((context: { item: GridContextMenuItem<Row>; menuState: GridContextMenuState<Row> }) => boolean)>;
  headerItems?: GridContextMenuItems<Row>;
  hiddenMap?: Record<string, boolean | ((context: { item: GridContextMenuItem<Row>; menuState: GridContextMenuState<Row> }) => boolean)>;
  labels?: Record<string, string>;
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
  data?: Row[];
  rows?: Row[];
  columns?: GridColumnDef<Row>[];
  aggregationConfig?: AggregationConfig;
  appId?: GridInstanceId;
  autoPageSize?: boolean;
  columnRequest?: typeof fetch;
  contextMenuConfig?: GridContextMenuConfig<Row>;
  defaultColumns?: GridColumnDef<Row>[];
  editingEnabled?: boolean;
  enableAltRow?: boolean;
  fetchColumns?: boolean | GridColumnPreferencesAdapter['load'];
  getCellProps?: (context: Record<string, unknown>) => Record<string, unknown>;
  getHeaderProps?: (context: Record<string, unknown>) => Record<string, unknown>;
  getRowProps?: (context: Record<string, unknown>) => Record<string, unknown>;
  gridId?: GridInstanceId;
  initialAutoPageSize?: boolean;
  initialEditingEnabled?: boolean;
  initialPageSize?: number;
  initialRowDensity?: string;
  initialSelectionMode?: string;
  initialShowAllRows?: boolean;
  loading?: boolean;
  locale?: string;
  labels?: Partial<GridLabels> & Record<string, string>;
  formatMessage?: GridFormatMessage;
  components?: GridComponents;
  themeTokens?: GridThemeTokens;
  footerConfig?: GridFooterConfig;
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
  getRowId?: (row: Row, index: number) => string;
  rowIdField?: keyof Row | string;
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

export interface TanStackGridCompatProps<Row extends RowData = RowData> extends TanStackGridProps<Row> {
  aggregationConfig?: unknown;
  autoCalculatePageSize?: boolean;
  contextMenu?: SyncfusionContextMenuCompat;
  data?: Row[];
  decoration?: Record<string, unknown>;
  disablePaging?: boolean;
  enableSelectionColumn?: boolean;
  footerConfig?: GridFooterConfig;
  lowRowHeight?: boolean;
  pageSettings?: { pageSize?: number; pageSizes?: number[] };
  selectionSettings?: { type?: 'Single' | 'Multiple' | string };
  templateRules?: SyncfusionTemplateRuleCompat[];
}
