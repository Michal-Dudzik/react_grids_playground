# Cell Coloring Feature

Provides flexible cell and row coloring, styling, icons, and tooltips for SyncfusionGrid.

## Exports

- `useDecoration(options)` (hook)

## Usage

Pass functions like `getRowClassName`, `getRowStyle`, `getCellClassName`, `getCellStyle`, `getCellIcon`, and
`getCellTooltip` to SyncfusionGrid. The hook returns handlers for Syncfusion's `queryCellInfo` and `rowDataBound`
events.

```js
// This will highlight rows with amount > 1000, fade inactive rows, color price cells, add a 💰 icon to high prices, and show tooltips for amount cells.
const getRowClassName = row => row.amount > 1000 ? 'row-highlight' : '';
const getRowStyle = row => row.status === 'Inactive' ? {opacity: 0.5} : {};
const getCellClassName = (row, field) => field === 'price' && row.price > 100 ? 'cell-price-high' : '';
const getCellStyle = (row, field) => field === 'amount' && row.amount < 200 ? {color: 'red', fontWeight: 'bold'} : {};
const getCellIcon = (row, field) => field === 'price' && row.price > 100 ? '💰' : '';
const getCellTooltip = (row, field) => field === 'amount' ? `Amount: ${row.amount}` : '';

<SyncfusionGrid
  ...
getRowClassName = {getRowClassName}
getRowStyle = {getRowStyle}
getCellClassName = {getCellClassName}
getCellStyle = {getCellStyle}
getCellIcon = {getCellIcon}
getCellTooltip = {getCellTooltip}
/>
```

_Effect: Rows with high amounts are highlighted, inactive rows are faded, expensive prices are colored and show a 💰
icon, and hovering over amount cells shows a tooltip._

## Extension

- Add new decoration logic in the hook.
- Compose multiple coloring rules as needed.
