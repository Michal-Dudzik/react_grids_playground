# Current Syncfusion Grid Feature Checklist

This document describes the **actual current functionality** of the project's shared `SyncfusionGrid` feature.

It is intended as a migration/research checklist for evaluating replacement grids such as `react-data-grid` or `@tanstack/react-table`.

Important nuance:
- This is not just a list of generic Syncfusion Grid features.
- It includes the project's custom wrapper behavior built around Syncfusion.
- A replacement grid needs to cover this combined feature set, not only the raw grid widget.

## Core Grid Behavior

- Render tabular data from either:
  - local `columns`
  - API-fetched column definitions via `appId` + `gridId`
- Enable sorting at grid and column level
- Enable Excel-style filter UI when filtering is on
- Support row selection
- Support optional checkbox selection column
- Support single-select and multi-select behavior
- Expose selected rows to parent components
- Support row double-click callbacks
- Support inline editing on screens that enable it
- Forward additional grid props/events down to the underlying Syncfusion grid

## Search and Paging

- Shared wrapper-level search, not Syncfusion-native search
- Search across configured fields or all row values
- Search input state, search execution, and clear action
- Search term highlighting in rendered cells
- `onSearchPropsChange` hook to expose search controls to parent screens
- Client-side paging
- Configurable page sizes
- Option to disable paging and show all filtered rows
- Auto-calculated page size based on available height
- Configurable row height
- Compact/low-row-height mode

## Column Management

- Local column mode
- API-backed column mode using `appId` and `gridId`
- Fetch user-specific column configuration from API
- Persist column order to API
- Persist column visibility to API
- Persist column width to API
- Reset column configuration to defaults
- Column settings modal with:
  - drag-and-drop reorder
  - width editing
  - visibility toggling
  - sync widths from live rendered grid DOM

## Templates and Custom Rendering

- Rule-based template application to columns
- Template rules can target dynamically loaded API columns
- Built-in reusable templates for common data presentation
- Search highlight template injection
- Custom React rendering inside cells
- Template matching by field name, data type, or custom metadata
- Support for special correction/before-after layouts
- Support for boolean/status-style template rendering

## Presentation Rules

- User-editable presentation rules stored per grid
- Presentation editor modal
- Support for two rule types:
  - template
  - decoration
- Rule targets:
  - cell
  - row
  - header
- Supported condition operators include:
  - always
  - equals / notEquals
  - contains / startsWith / endsWith
  - gt / gte / lt / lte
  - isEmpty / isNotEmpty
  - isTrue / isFalse
- Rule priority ordering
- Merge default rules with user-saved rules
- Persist presentation config in local storage

## Decorations and Conditional Styling

- Row-level class/style decoration
- Cell-level class/style decoration
- Header-level decoration
- Cell icon decoration
- Cell tooltip decoration
- Unified decoration from code-defined rules and saved presentation rules

## Aggregation / Summary Behavior

- Custom aggregation bar outside the main grid body
- Aggregate toggle in the shared footer
- Aggregation computed on:
  - current page
  - full filtered dataset
- Supported aggregate types:
  - `sum`
  - `avg`
  - `min`
  - `max`
  - `custom`
- Automatic detection of likely aggregatable columns
- Explicit `aggregationConfig` support
- Width synchronization between grid and aggregation bar
- Scroll synchronization between grid and aggregation bar
- Localized aggregation labels/tooltips
- Responsive aggregate display with number formatting

## Context Menu

- Built-in context menu items:
  - `AutoFit`
  - `AutoFitAll`
  - `SortAscending`
  - `SortDescending`
  - `FirstPage`
  - `PrevPage`
  - `LastPage`
  - `NextPage`
- Custom context menu items
- Nested/submenu items
- Localized menu labels
- Targeted menu items by grid area
- Dynamic hide/show rules
- Dynamic disabled rules
- Action dispatch for custom menu items
- Disabled-state enforcement in rendered menu DOM

## Export and Print

- Excel export from the shared footer
- Current implementation uses Syncfusion's `excelExport` API
- Print dropdown in the shared footer
- Print modes:
  - print all rows
  - print current page
  - print selected rows
- Selection-aware print option disabling
- Custom print pipeline using processed columns and measured widths

## Footer and Integration Features

- Shared footer with:
  - search UI
  - paging controls
  - filter toggle
  - aggregation toggle
  - print actions
  - Excel export
  - column settings
  - presentation settings
  - custom injected buttons
  - custom injected components
- Footer button override/merge behavior
- Selection count passed into footer actions

## State, Persistence, and UX

- Loading overlay while data or columns are not ready
- Error boundary around the grid
- Filter state stored per-grid key
- Presentation state stored per-grid key
- Locale-sensitive behavior for column loading and labels
- Imperative ref API for:
  - grid instance
  - selected rows
  - processed columns
  - print all/current/selected
  - selected row count
  - selected row presence

## Known Shared Wrapper Dependencies

These are the current features most likely to require substantial custom work in any replacement:

- API-backed column persistence
- Column settings modal
- Rule-based presentation editor
- Rule-based templates and decorations
- Custom aggregation bar with sync logic
- Shared search/highlight flow
- Shared footer actions
- Custom print pipeline
- Excel export replacement
- Dynamic context menu behavior

## Short Testing Checklist

Use this list when testing alternative grids:

- API-backed column load/save/reset
- Column reorder / resize / show-hide
- Inline editing with custom edit lifecycle hooks
- Search + highlighted matches
- Paging + disable paging + auto page size
- Selection column + selected rows API
- Context menu with dynamic hide/disable/actions/submenus
- Rule-based custom cell templates
- Conditional row/cell/header styling
- User-editable presentation rules
- Aggregation bar with page vs total aggregates
- Excel export
- Print all/current/selected
- Custom footer actions
- Imperative access to selected rows / print methods
