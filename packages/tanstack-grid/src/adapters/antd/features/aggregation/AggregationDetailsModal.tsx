import type { ComponentType } from 'react';
import type { AggregationColumnSummary } from '../../../../core/tableAggregation';
import type { GridModalProps } from '../../../../types';
import type { AggregationScope, AggregationSummaryLabels } from './AggregationSummaryRow';

interface AggregationDetailsModalProps {
  aggregationLabels: AggregationSummaryLabels;
  aggregationScope: AggregationScope;
  ModalComponent: ComponentType<GridModalProps>;
  onClose: () => void;
  open: boolean;
  summaries: AggregationColumnSummary[];
}

export function AggregationDetailsModal({
  aggregationLabels,
  aggregationScope,
  ModalComponent,
  onClose,
  open,
  summaries,
}: AggregationDetailsModalProps) {
  const operationKeys = Array.from(
    new Set(summaries.flatMap((summary) => summary.values.map((item) => String(item.key ?? item.label ?? '')))),
  ).filter(Boolean);
  const operationLabels = new Map(
    summaries.flatMap((summary) =>
      summary.values.map((item) => [String(item.key ?? item.label ?? ''), item.label ?? item.key ?? '']),
    ),
  );

  return (
    <ModalComponent
      className="shared-grid-modal"
      footer={null}
      onClose={onClose}
      open={open}
      title={aggregationLabels.details}
      width={760}
    >
      <div className="tanstack-grid__aggregation-modal">
        <div className="tanstack-grid__aggregation-modal-scope">
          <span>{aggregationLabels.scope}</span>
          <strong>{aggregationScope === 'all' ? aggregationLabels.all : aggregationLabels.page}</strong>
        </div>

        {summaries.length > 0 ? (
          <div className="tanstack-grid__aggregation-modal-table-wrap">
            <table className="tanstack-grid__aggregation-modal-table">
              <thead>
                <tr>
                  <th>{aggregationLabels.summary}</th>
                  {operationKeys.map((operationKey) => (
                    <th key={operationKey}>{operationLabels.get(operationKey)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => {
                  const valuesByOperation = new Map(
                    summary.values.map((item) => [String(item.key ?? item.label ?? ''), item.value]),
                  );

                  return (
                    <tr key={summary.key}>
                      <th scope="row">{summary.label}</th>
                      {operationKeys.map((operationKey) => (
                        <td key={operationKey}>{valuesByOperation.get(operationKey) ?? ''}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="tanstack-grid__aggregation-empty">{aggregationLabels.noAggregatableColumns}</p>
        )}
      </div>
    </ModalComponent>
  );
}
