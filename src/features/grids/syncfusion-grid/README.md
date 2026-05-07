# SyncfusionGrid

Shared grid wrapper built on top of `@syncfusion/ej2-react-grids`.

It adds:
- shared footer with search, paging, print, export, and column settings
- API-backed or local column configuration
- search highlighting
- optional aggregation bar
- decoration hooks for rows, cells, and headers
- template-rule processing for dynamic columns

## Basic Usage

```jsx
import SyncfusionGrid from "./SyncfusionGrid.jsx";

const columns = [
    {field: "code", headerText: "Code", width: 120},
    {field: "description", headerText: "Description", width: 260},
];

<SyncfusionGrid
    data={rows}
    columns={columns}
/>;
```

## Modes

### Local Columns

Use `columns` only.

```jsx
<SyncfusionGrid
    data={rows}
    columns={columns}
    footerConfig={{
        showColumnsSettings: true,
    }}
/>
```

Column settings work in-memory for the current grid instance.

### API-backed Columns

Use `appId` and `gridId`.

```jsx
<SyncfusionGrid
    data={rows}
    appId={34}
    gridId={29}
/>
```

In this mode:
- columns are fetched through the grid columns API
- the column settings modal persists order, visibility, and width through the API
- filtering visibility state is still stored locally per grid key

## Props

### Core

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `Array` | required | Source rows shown by the grid |
| `columns` | `Array` | `[]` | Used directly in local mode and as fallback while API columns load |
| `appId` | `number` | - | Enables API-backed column loading when combined with `gridId` |
| `gridId` | `number` | - | Enables API-backed column loading when combined with `appId` |
| `transformColumnsFn` | `function` | - | Final column transform after shared mapping/standardization |
| `loading` | `boolean` | `false` | Shows the shared loading overlay |

### Grid Behavior

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `allowSorting` | `boolean` | `true` | Passed to the grid |
| `allowFiltering` | `boolean` | `true` | Controls whether Syncfusion filter UI is enabled |
| `enableSelectionColumn` | `boolean` | `false` | Adds the checkbox selection column and switches selection to multi-row |
| `enableAltRow` | `boolean` | `true` | Toggles alternating row background styling |
| `allowEditing` | `boolean` | `false` | Enables Syncfusion edit module |
| `editSettings` | `object` | `{}` | Merged into Syncfusion `editSettings` |
| `selectionSettings` | `object` | derived | Overrides shared default selection settings |
| `contextMenu` | `object` | `{}` | Expects `contextMenuItems`, `onContextMenuClick`, and optional `disabledMap` |

### Search, Paging, Layout

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `searchFields` | `Array<string>` | `[]` | When empty, search checks all row values |
| `pageSettings` | `object` | `{ pageSize: 50, pageSizes: [20, 50, 100, 150] }` | Shared paging state lives outside Syncfusion paging |
| `disablePaging` | `boolean` | `false` | Returns all filtered rows instead of slicing pages |
| `autoCalculatePageSize` | `boolean` | `false` | Recomputes page size from available height |
| `lowRowHeight` | `boolean` | `false` | Uses `32px` rows instead of `42px` |
| `rowHeight` | `number` | derived | Explicit row height; overrides `lowRowHeight` |

### Presentation

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `decoration` | `object` | `{}` | Passed into `useDecoration` |
| `templateRules` | `Array` | - | Rule-based template injection for processed columns |
| `aggregationConfig` | `Array` | - | Enables/controls custom aggregation output |

### Events / Integration

| Prop | Type | Notes |
| --- | --- | --- |
| `onSelectionChange` | `function(selectedRows)` | Fired from shared selection handlers |
| `onRowDoubleClick` | `function(row)` | Fired when a row is double-clicked |
| `onSearchPropsChange` | `function(searchProps)` | Exposes the shared search bar handlers to parent components |

### Footer

`footerConfig` defaults to:

```js
{
    showFooter: true,
    showPrint: true,
    showExportExcel: true,
    showColumnsSettings: false,
    hidePageCount: false,
    buttons: []
}
```

Supported fields:

| Field | Type | Notes |
| --- | --- | --- |
| `showFooter` | `boolean` | Hides the entire shared footer when `false` |
| `showPrint` | `boolean` | Shows the print dropdown |
| `showExportExcel` | `boolean` | Shows the Excel export button |
| `showColumnsSettings` | `boolean` | Shows the shared column settings modal button |
| `hidePageCount` | `boolean` | Hides the page-size selector |
| `buttons` | `Array` | Additional custom footer buttons/components |

Custom footer button shape:

```js
{
    key: "my-action",
    title: "Run action",
    icon: <MyIcon />,
    onClick: () => {},
}
```

Custom footer component shape:

```js
{
    key: "my-component",
    isCustomComponent: true,
    component: <MyComponent />,
}
```

## Search Behavior

Search is shared, not Syncfusion-native.

- typing updates the input state
- filtering happens when search is submitted
- clear resets both input and applied term
- matches are highlighted in rendered cells through template rules

If you need to drive search from outside the footer, use `onSearchPropsChange`.

## Column Settings

The shared `ColumnSettingsModal` supports:
- order
- visibility
- width
- sync widths from the live grid

Behavior depends on mode:
- local mode: applies changes in memory only
- API-backed mode: saves and resets through the grid columns API

## Decoration

`decoration` is passed to `useDecoration`.

Supported callbacks:
- `getRowClassName(row)`
- `getRowStyle(row)`
- `getCellClassName(row, field)`
- `getCellStyle(row, field)`
- `getCellIcon(row, field)`
- `getCellTooltip(row, field)`
- `getRowDecoration(row)`
- `getCellDecoration(row, field)`
- `getColumnDecoration(field)`

`getColumnDecoration` is wired to Syncfusion `headerCellInfo`.

## Templates

`templateRules` are applied after shared column processing.

Each rule has:

```js
{
    match: (column) => boolean,
    template: ReactComponentOrTemplateFn,
}
```

The grid also injects shared template rules for:
- built-in column templates
- search highlighting when a search term is applied

For reusable template helpers, see:
- [features/templates/useTemplates.jsx](/Users/piekna/WebstormProjects/todis_webbox_web/src/shared/ui/syncfusion-grid/features/templates/useTemplates.jsx)
- [features/templates/README.md](/Users/piekna/WebstormProjects/todis_webbox_web/src/shared/ui/syncfusion-grid/features/templates/README.md)

## Aggregation

`aggregationConfig` should be an array like:

```js
[
    {field: "amount", types: ["sum", "avg", "min", "max"]},
    {field: "net", types: ["sum"]},
    {field: "customValue", types: ["custom"], customFn: (rows, field) => ...},
]
```

Notes:
- the aggregation bar is shown from the footer toggle when aggregatable columns exist
- page and total values are computed separately
- without `aggregationConfig`, the grid falls back to heuristic aggregate detection

## Imperative Ref API

`SyncfusionGrid` exposes:

```js
gridRef.current?.getGridInstance();
gridRef.current?.getSelectedRows();
gridRef.current?.getColumns();
gridRef.current?.printAll();
gridRef.current?.printCurrentPage();
gridRef.current?.printSelected();
gridRef.current?.getSelectedRowsCount();
gridRef.current?.hasSelectedRows();
```

`getColumns()` returns the processed base columns from the shared column pipeline.

## Pass-through Syncfusion Props

Extra props are forwarded to `GridBase`, then to `GridComponent`.

That means you can still pass Syncfusion handlers and options such as:
- `actionBegin`
- `actionComplete`
- `toolbar`
- `cellEdit`
- `allowTextWrap`

Use this sparingly; shared behavior should stay in the wrapper when possible.

## Current Notes

- The grid uses local storage to remember whether filtering UI is enabled for a given grid key.
- Column API failures no longer force the wrapper to render `null`; the grid now stays renderable when column loading completes with fallback or empty state.
- Print is supported through the shared footer/ref API and currently relies on the existing custom print implementation.
