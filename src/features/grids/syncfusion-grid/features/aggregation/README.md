# Aggregation Feature

Provides custom aggregation logic and a custom aggregation bar for SyncfusionGrid.

## Exports

- `getCustomAggregates(columns, pagedData, totalData, aggregationConfig)`
- `AggregationBar` (React component)
- `useAggregationSync` (React hook for synchronization logic)

## Usage

Integrate with SyncfusionGrid to display custom aggregates (sum, avg, min, max, custom) for selected columns. Pass an `aggregationConfig` prop to control which aggregates are shown.

```js
// This will show sum, average, min, and max for 'amount', and sum/avg for 'price' in the aggregation bar.
const aggregationConfig = [
  { field: 'amount', types: ['sum', 'avg', 'min', 'max'] },
  { field: 'price', types: ['sum', 'avg'] },
];

<SyncfusionGrid
  ...
  aggregationConfig={aggregationConfig}
/>
```

_Effect: The aggregation bar will display Σ, Avg, Min, Max for 'amount' and Σ, Avg for 'price' columns, updating as you page or filter._

## Features

- **Smart Number Formatting**: Automatically uses compact notation (1.2K, 1.5M) for large numbers
- **Responsive Layout**: Adapts to available space with proper column alignment
- **Enhanced Tooltips**: Shows full precision values on hover
- **Localization Support**: Fully localized using react-intl

## Localization

The aggregation bar is fully localized and requires the following translation keys:

### Required Translation Keys

Add these keys to your localization files:

```json
{
  "txtSuma": "Σ",
  "txtSrednia": "Śr",
  "txtMinimum": "Min",
  "txtMaksimum": "Max",
  "txtWlasne": "Własne",
  "txtStrona": "Strona",
  "txtLacznie": "Łącznie"
}
```

### Translation Key Usage

- **txtSuma**: Sum aggregation label (displays as "Σ")
- **txtSrednia**: Average aggregation label (displays as "Śr")
- **txtMinimum**: Minimum aggregation label (displays as "Min")
- **txtMaksimum**: Maximum aggregation label (displays as "Max")
- **txtWlasne**: Custom aggregation label (displays as "Własne")
- **txtStrona**: "Page" text used in multi-page tooltips
- **txtLacznie**: "Total" text used in tooltips

## useAggregationSync Hook

Custom hook that manages all aggregation synchronization logic including width calculations and scroll synchronization.

### Parameters

```javascript
const { columnWidths, gridContentWidth } = useAggregationSync({
  gridRef, // Reference to the grid instance
  aggregationBarRef, // Reference to the aggregation bar
  showAggregates, // Whether aggregation bar is visible
  pagedData, // Current page data
  processedColumns, // Processed grid columns
});
```

### Returns

- `columnWidths`: Array of actual column widths from DOM
- `gridContentWidth`: Total grid content width

### Features

- Automatic width calculation with fallback strategies
- ResizeObserver integration for responsive updates
- Multiple timeout attempts for DOM readiness
- Scroll synchronization between grid and aggregation bar
- Performance optimized with state change detection

## Extension

- Add new aggregate types in the aggregation utility file.
- Customize the bar layout in `AggregationBar.jsx`.
- Add new localization keys following the `txt[Term]` pattern.
- Use `useAggregationSync` hook for custom grid implementations requiring aggregation synchronization.
