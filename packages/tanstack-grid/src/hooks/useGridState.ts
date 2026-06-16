import { useEffect, useRef, useState } from 'react';
import type { AggregationScope } from '../adapters/antd/features/aggregation/TanStackTableSummaryPanel';
import type { GridFeatureFlags, TanStackGridProps } from '../types';

export interface UseGridStateParams<Row> {
  autoPageSize?: boolean;
  columnPreferences?: TanStackGridProps<Row>['columnPreferences'];
  controlledState?: TanStackGridProps<Row>['controlledState'];
  editingEnabled?: boolean;
  features?: GridFeatureFlags;
  fetchColumns?: TanStackGridProps<Row>['fetchColumns'];
  initialAutoPageSize?: boolean;
  initialEditingEnabled?: boolean;
  initialPageSize?: number;
  initialRowDensity?: string;
  initialSelectionMode?: string;
  initialShowAllRows?: boolean;
  initialState?: TanStackGridProps<Row>['initialState'];
  localRows?: Row[];
  onSaveColumnPreferences?: TanStackGridProps<Row>['onSaveColumnPreferences'];
  pageSize?: number;
  rowDensity?: string;
  selectionMode?: string;
  showAllRows?: boolean;
}

export function useGridState<Row>({
  autoPageSize: controlledAutoPageSize,
  columnPreferences = {},
  controlledState = {},
  editingEnabled: controlledEditingEnabled,
  features = {},
  fetchColumns,
  initialAutoPageSize = false,
  initialEditingEnabled = true,
  initialPageSize = 5,
  initialRowDensity = 'standard',
  initialSelectionMode = 'multi',
  initialShowAllRows = false,
  initialState = {},
  localRows = [],
  onSaveColumnPreferences,
  pageSize: controlledPageSize,
  rowDensity: controlledRowDensity,
  selectionMode: controlledSelectionMode,
  showAllRows: controlledShowAllRows,
}: UseGridStateParams<Row>) {
  const tableWrapRef = useRef<HTMLDivElement | null>(null);
  const [tableData, setTableData] = useState(() => localRows);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectionModeState] = useState(initialSelectionMode);
  const [pagination, setPagination] = useState<{ pageIndex: number; pageSize: number }>({
    pageIndex: 0,
    pageSize: controlledState.pageSize ?? controlledPageSize ?? initialState.pageSize ?? initialPageSize,
  });
  const [showAllRowsState] = useState(initialState.showAllRows ?? initialShowAllRows);
  const [autoPageSizeState] = useState(initialState.autoPageSize ?? initialAutoPageSize);
  const [rowDensityState] = useState(initialState.rowDensity ?? initialRowDensity);
  const [editingEnabledState] = useState(initialState.editingEnabled ?? initialEditingEnabled);
  const [showSummary, setShowSummary] = useState(false);
  const [aggregationScope, setAggregationScope] = useState<AggregationScope>('page');
  const [aggregationColumnId, setAggregationColumnId] = useState('revenue');
  const [activeRow, setActiveRow] = useState<Row | null>(null);
  const [lastDoubleClickedRow, setLastDoubleClickedRow] = useState<Row | null>(null);
  const [openFilterColumnId, setOpenFilterColumnId] = useState('');
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);

  const featureFlags = {
    columnSettings: true,
    contextMenu: true,
    export: true,
    filtering: true,
    pagination: true,
    presentation: true,
    print: true,
    selection: true,
    summary: true,
    ...features,
  };
  const selectionMode = controlledState.selectionMode ?? controlledSelectionMode ?? selectionModeState;
  const showAllRows = controlledState.showAllRows ?? controlledShowAllRows ?? showAllRowsState;
  const autoPageSize = controlledState.autoPageSize ?? controlledAutoPageSize ?? autoPageSizeState;
  const rowDensity = controlledState.rowDensity ?? controlledRowDensity ?? rowDensityState;
  const editingEnabled = controlledState.editingEnabled ?? controlledEditingEnabled ?? editingEnabledState;
  const loadColumns =
    columnPreferences.load ?? (typeof fetchColumns === 'function' ? fetchColumns : undefined);
  const saveColumnPreferences =
    columnPreferences.save ??
    onSaveColumnPreferences ??
    (async () => ({ skipped: true, success: true }));

  useEffect(() => {
    setRowSelection({});
  }, [selectionMode]);

  useEffect(() => {
    setTableData(Array.isArray(localRows) ? localRows : []);
  }, [localRows]);

  useEffect(() => {
    const effectiveControlledPageSize = controlledState.pageSize ?? controlledPageSize;

    if (effectiveControlledPageSize === undefined) {
      return;
    }

    setPagination((current) =>
      current.pageSize === effectiveControlledPageSize
        ? current
        : {
            ...current,
            pageIndex: 0,
            pageSize: effectiveControlledPageSize,
          },
    );
  }, [controlledPageSize, controlledState.pageSize]);

  return {
    activeRow,
    aggregationColumnId,
    aggregationScope,
    autoPageSize,
    editingEnabled,
    featureFlags,
    lastDoubleClickedRow,
    loadColumns,
    openFilterColumnId,
    pagination,
    rowDensity,
    rowSelection,
    saveColumnPreferences,
    selectionMode,
    setActiveRow,
    setAggregationColumnId,
    setAggregationScope,
    setLastDoubleClickedRow,
    setOpenFilterColumnId,
    setPagination,
    setRowSelection,
    setShowSummary,
    setSorting,
    setTableData,
    setTemplateEditorOpen,
    showAllRows,
    showSummary,
    sorting,
    tableData,
    tableWrapRef,
    templateEditorOpen,
  };
}
