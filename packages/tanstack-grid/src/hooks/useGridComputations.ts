import type { RowData, Table } from '@tanstack/react-table';
import { useMemo } from 'react';
import type { AggregationScope } from '../adapters/antd/features/aggregation/AggregationSummaryRow';
import { getAggregationColumnOptions, getColumnAggregationSummaries } from '../core/tableAggregation';
import { defaultAggregationLabels, pageSizeChoices, rowDensityConfigs } from '../core/tableConfig';
import { isAdvancedFilterActive } from '../core/tableFilters';
import type { AggregationConfig, AggregationRowData, AggregationTableRow } from '../core/tableAggregation';

export interface UseGridComputationsParams<Row extends RowData> {
  aggregationColumnId: string;
  aggregationConfig?: AggregationConfig;
  aggregationLabels?: Record<string, string>;
  aggregationScope: AggregationScope;
  columnFilters: { value: unknown }[];
  locale: string;
  pagination: { pageIndex: number; pageSize: number };
  rowDensity: string;
  showAllRows: boolean;
  table: Table<Row>;
}

export function useGridComputations<Row extends RowData>({
  aggregationColumnId,
  aggregationConfig = {},
  aggregationLabels: aggregationLabelsOverride,
  aggregationScope,
  columnFilters,
  locale,
  pagination,
  rowDensity,
  showAllRows,
  table,
}: UseGridComputationsParams<Row>) {
  const matchingRows = table.getPrePaginationRowModel().rows;
  const visibleRows = showAllRows ? matchingRows : table.getRowModel().rows;
  const allRows = table.getCoreRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;
  const visibleExportColumns = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== 'select');
  const activeColumnFilters = columnFilters.filter((filter) => isAdvancedFilterActive(filter.value)).length;
  const rowDensityConfig = rowDensityConfigs[rowDensity] ?? rowDensityConfigs.standard;

  const aggregateRows = aggregationScope === 'all' ? matchingRows : visibleRows;
  const aggregationLabels = {
    ...defaultAggregationLabels,
    ...(aggregationLabelsOverride ?? {}),
    ...(aggregationConfig.labels ?? {}),
  };
  const aggregationColumnOptions = getAggregationColumnOptions(
    visibleExportColumns,
    allRows as AggregationTableRow<AggregationRowData>[],
    aggregationConfig,
  );
  const effectiveAggregationColumnId = aggregationColumnOptions.some((option) => option.key === aggregationColumnId)
    ? aggregationColumnId
    : aggregationColumnOptions[0]?.key ?? '';
  const aggregationSummaries = getColumnAggregationSummaries({
    aggregationConfig,
    columnDetectionRows: allRows as AggregationTableRow<AggregationRowData>[],
    columns: visibleExportColumns,
    labels: aggregationLabels,
    locale,
    tableRows: aggregateRows as AggregationTableRow<AggregationRowData>[],
  });

  const pageSizeOptions = useMemo(
    () =>
      pageSizeChoices.includes(pagination.pageSize)
        ? pageSizeChoices
        : [...pageSizeChoices, pagination.pageSize].sort((first, second) => first - second),
    [pagination.pageSize],
  );

  return {
    activeColumnFilters,
    aggregationColumnOptions,
    aggregationLabels,
    aggregationSummaries,
    effectiveAggregationColumnId,
    allRows,
    matchingRows,
    pageSizeOptions,
    rowDensityConfig,
    selectedRows,
    visibleExportColumns,
    visibleRows,
  };
}
