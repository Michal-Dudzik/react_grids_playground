import { UnorderedListOutlined } from '@ant-design/icons';
import type { Column } from '@tanstack/react-table';
import { Button, Segmented } from 'antd';
import type { AggregationColumnSummary } from '../../../../core/tableAggregation';

export type AggregationScope = 'page' | 'all';

export interface AggregationSummaryLabels {
  all: string;
  details: string;
  noAggregatableColumns: string;
  page: string;
  scope: string;
  summary: string;
}

interface AggregationSummaryRowProps {
  aggregationLabels: AggregationSummaryLabels;
  aggregationScope: AggregationScope;
  summaries: AggregationColumnSummary[];
  visibleColumns: Array<Column<unknown, unknown>>;
}

interface AggregationSummaryToolbarProps {
  aggregationLabels: AggregationSummaryLabels;
  aggregationScope: AggregationScope;
  hasSummaries: boolean;
  onDetailsClick: () => void;
  onScopeChange: (scope: AggregationScope) => void;
}

function getSummaryTitle(summary: AggregationColumnSummary | undefined): string | undefined {
  if (!summary) {
    return undefined;
  }

  return summary.values.map((item) => `${item.label}: ${item.value}`).join('\n');
}

export function AggregationSummaryToolbar({
  aggregationLabels,
  aggregationScope,
  hasSummaries,
  onDetailsClick,
  onScopeChange,
}: AggregationSummaryToolbarProps) {
  return (
    <div className="tanstack-grid__aggregation-toolbar">
      <div className="tanstack-grid__aggregation-toolbar-title">
        <strong>{aggregationLabels.summary}</strong>
        <span>{hasSummaries ? aggregationLabels.scope : aggregationLabels.noAggregatableColumns}</span>
      </div>
      <div className="tanstack-grid__aggregation-toolbar-actions">
        <Segmented
          aria-label={aggregationLabels.scope}
          onChange={(value) => onScopeChange(value as AggregationScope)}
          options={[
            { label: aggregationLabels.page, value: 'page' },
            { label: aggregationLabels.all, value: 'all' },
          ]}
          size="small"
          value={aggregationScope}
        />
        <Button
          disabled={!hasSummaries}
          icon={<UnorderedListOutlined />}
          onClick={onDetailsClick}
          size="small"
          title={aggregationLabels.details}
          type="text"
        >
          {aggregationLabels.details}
        </Button>
      </div>
    </div>
  );
}

export function AggregationSummaryRow({
  aggregationLabels,
  summaries,
  visibleColumns,
}: AggregationSummaryRowProps) {
  const summariesByColumn = new Map(summaries.map((summary) => [summary.columnId, summary]));

  return (
    <tfoot className="tanstack-grid__aggregation-foot">
      <tr>
        {visibleColumns.map((column) => {
          const summary = summariesByColumn.get(column.id);

          return (
            <td
              className={summary ? 'tanstack-grid__aggregation-cell' : 'tanstack-grid__aggregation-cell--empty'}
              key={column.id}
              style={{ width: column.getSize() }}
              title={getSummaryTitle(summary)}
            >
              {summary ? (
                <div className="tanstack-grid__aggregation-cell-content">
                  <span className="tanstack-grid__aggregation-column-label">{summary.label}</span>
                  <span className="tanstack-grid__aggregation-values">
                    {summary.values.map((item) => (
                      <span className="tanstack-grid__aggregation-chip" key={item.key ?? item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </span>
                    ))}
                  </span>
                </div>
              ) : (
                <span className="tanstack-grid__sr-only">{aggregationLabels.noAggregatableColumns}</span>
              )}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}
