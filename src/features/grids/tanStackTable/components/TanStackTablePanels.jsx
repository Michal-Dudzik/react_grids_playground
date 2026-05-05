import { Switch } from 'antd';
import { GridSummaryBar } from './GridSummaryBar';
import { rowDensityConfigs } from '../lib/tableConfig';
import { AdvancedColumnFilterButton } from './TanStackTableComponents';

export function TanStackTableToolbar({
  autoPageSize,
  editingEnabled,
  onEditingEnabledChange,
  onAutoPageSizeChange,
  onPageSizeChange,
  onRowDensityChange,
  onSelectionModeChange,
  onShowAllRowsChange,
  pageSize,
  pageSizeOptions,
  rowDensity,
  selectionMode,
  showAllRows,
}) {
  return (
    <div className="tanstack-grid__toolbar">
      <div className="tanstack-grid__controls">
        <label className="tanstack-grid__field">
          <span>Selection mode</span>
          <select onChange={(event) => onSelectionModeChange(event.target.value)} value={selectionMode}>
            <option value="multi">Multi-select</option>
            <option value="single">Single-select</option>
          </select>
        </label>

        <label className="tanstack-grid__field">
          <span>Page size</span>
          <select
            disabled={showAllRows || autoPageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} rows
              </option>
            ))}
          </select>
        </label>

        <label className="tanstack-grid__field">
          <span>Density</span>
          <select onChange={(event) => onRowDensityChange(event.target.value)} value={rowDensity}>
            {Object.entries(rowDensityConfigs).map(([densityKey, densityConfig]) => (
              <option key={densityKey} value={densityKey}>
                {densityConfig.label}
              </option>
            ))}
          </select>
        </label>

        <label className="tanstack-grid__field">
          <span>Edit mode</span>
          <Switch checked={editingEnabled} onChange={onEditingEnabledChange} />
        </label>

        <label className="tanstack-grid__toggle">
          <input checked={showAllRows} onChange={(event) => onShowAllRowsChange(event.target.checked)} type="checkbox" />
          <span>Show all filtered rows</span>
        </label>

        <label className="tanstack-grid__toggle">
          <input
            checked={autoPageSize}
            disabled={showAllRows}
            onChange={(event) => onAutoPageSizeChange(event.target.checked)}
            type="checkbox"
          />
          <span>Auto page size</span>
        </label>
      </div>
    </div>
  );
}

export function TanStackTableFiltersPanel({
  activeColumnFilters,
  columns,
  onClearAdvancedColumnFilter,
  onClearColumnFilters,
  onToggleColumn,
  onUpdateAdvancedColumnFilter,
  openFilterColumnId,
  rows,
}) {
  return (
    <div className="tanstack-grid__inline-panel">
      <div className="tanstack-grid__filters">
        {columns.map((column) => (
          <AdvancedColumnFilterButton
            column={column}
            isOpen={openFilterColumnId === column.id}
            key={column.id}
            onClear={onClearAdvancedColumnFilter}
            onClose={() => onToggleColumn('')}
            onFilterChange={onUpdateAdvancedColumnFilter}
            onToggle={() => onToggleColumn(openFilterColumnId === column.id ? '' : column.id)}
            rows={rows}
          />
        ))}

        <div className="tanstack-grid__filter-actions">
          <span className="tanstack-grid__filter-count">
            {activeColumnFilters} active filter{activeColumnFilters === 1 ? '' : 's'}
          </span>
          <button className="tanstack-grid__button" onClick={onClearColumnFilters} type="button">
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

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
