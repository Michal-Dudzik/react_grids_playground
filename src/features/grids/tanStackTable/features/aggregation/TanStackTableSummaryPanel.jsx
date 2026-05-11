import { GridSummaryBar } from './GridSummaryBar';

export function TanStackTableSummaryPanel({
  aggregateItems,
  aggregationColumnOptions,
  aggregationLabels,
  aggregationScope,
  onAggregationColumnChange,
  onAggregationScopeChange,
  selectedAggregationColumnId,
  summaryItems,
}) {
  return (
    <>
      <GridSummaryBar items={summaryItems} />
      <div className="tanstack-grid__aggregation-bar">
        <div className="tanstack-grid__aggregation-controls">
          <span>{aggregationLabels.summary}</span>
          {aggregationColumnOptions.length > 1 ? (
            <select
              aria-label={aggregationLabels.aggregateColumn}
              onChange={(event) => onAggregationColumnChange(event.target.value)}
              value={selectedAggregationColumnId}
            >
              {aggregationColumnOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          <select
            aria-label={aggregationLabels.scope}
            onChange={(event) => onAggregationScopeChange(event.target.value)}
            value={aggregationScope}
          >
            <option value="page">{aggregationLabels.page}</option>
            <option value="filtered">{aggregationLabels.filtered}</option>
          </select>
        </div>

        <div className="tanstack-grid__aggregation-items">
          {aggregateItems.map((item) => (
            <span className="tanstack-grid__aggregation-item" key={item.key ?? item.label}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </span>
          ))}
          {aggregateItems.length === 0 ? (
            <span className="tanstack-grid__aggregation-empty">No numeric columns available</span>
          ) : null}
        </div>
      </div>
    </>
  );
}
