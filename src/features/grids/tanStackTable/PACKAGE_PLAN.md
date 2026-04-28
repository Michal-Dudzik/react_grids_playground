# Internal NPM-Ready TanStack Grid Package

## Summary
Convert the current TanStack feature from a playground-owned component into a same-repo package at `packages/tanstack-grid` with a strict separation between core grid logic, the default AntD UI adapter, and browser-side integrations. Keep the current grid behavior as the v1 baseline, but move all demo-only, app-only, and hardcoded side effects out of the package core.

The playground will stop owning the implementation and instead consume the package directly. That becomes the proof that the package is installable, updateable, and not coupled to the current app.

## Implementation Changes
- Create `packages/tanstack-grid` with its own `package.json`, `tsconfig.json`, `src/`, and build config.
- Build the package in TypeScript now. Migrate only the package slice, not the whole app.
- Use a package layout with fixed responsibilities:
  - `src/core/`: TanStack state orchestration, column normalization, filter/presentation logic, ref API, feature flags, pure helpers
  - `src/adapters/antd/`: footer, modals, summary bar, empty/error/loading UI, default button wiring
  - `src/adapters/browser/`: clipboard, CSV download, print, localStorage-backed persistence
  - `src/types/`: exported public types
  - `src/index.ts`: public exports only
  - `src/styles.css`: package-owned styles for the default AntD skin
- Do not include the toolbar in the package. The toolbar remains consumer-owned UI and stays in the playground or host app.
- Keep the playground feature entry in place, but reduce it to a thin consumer wrapper that imports from `packages/tanstack-grid` and provides demo rows, demo columns, demo status cell rendering, toolbar controls, and any showcase-only toggles.

- Remove current package-blocking couplings from the implementation:
  - move demo rows/columns out of package code; package core must never import `demoData`
  - remove the Syncfusion column-mapping dependency from package code; either duplicate the logic into a neutral utility inside the package or extract a grid-agnostic mapper into a shared non-Syncfusion helper
  - move hardcoded `/api/SysUserInfo/...` fetch/save behavior behind a consumer-provided adapter
  - move localStorage keys out of core constants and into adapter configuration
  - move clipboard/download/print DOM logic out of generic helpers and into browser adapters

- Split the current monolithic preview container into:
  - `TanStackGrid`: package component exported for consumers
  - `TanStackGridDemo`: app-only wrapper in the playground
- Keep the default UI shipped with the package, but make it an adapter layer rather than the core implementation. The package should still render out-of-the-box with AntD, but core logic must not depend on AntD components.
- Treat toolbar state and toolbar actions as consumer-controlled inputs to the package, not internal package concerns.

## Public APIs and Types
Export one stable primary component plus a small set of adapters and types.

- `TanStackGrid<Row>` as the main public component
- `createLocalStorageGridStateAdapter(options)` from the browser adapter
- `createHttpColumnPreferencesAdapter(options)` for async load/save of external column preferences
- exported types for:
  - `TanStackGridProps<Row>`
  - `GridColumnDef<Row>`
  - `GridFeatureFlags`
  - `GridStateAdapter<T>`
  - `GridColumnPreferencesAdapter`
  - `GridExportAdapter`
  - `GridPrintAdapter`
  - `GridSlots<Row>`
  - `GridPresentationRule`
  - `TanStackGridRef<Row>`

Use these prop groups on `TanStackGrid<Row>`:
- `rows`, `columns`, `getRowId`
- `features`
  - `selection`, `filtering`, `pagination`, `summary`, `presentation`, `contextMenu`, `columnSettings`, `export`, `print`
- `persistence`
  - `columnState`, `filterState`, `presentationRules`
- `columnPreferences`
  - `load`, `save`
- `slots`
  - overrideable UI pieces such as `statusCell`, `emptyState`, `loadingState`, `errorState`, `footerActions`
- `onSelectionChange`, `onRowActivate`, `onError`

Defaults:
- the package ships with the current AntD-based grid UI, excluding toolbar UI
- persistence is opt-in through adapters; the core does not silently persist by itself
- remote column preference load/save is opt-in; no hardcoded endpoint remains in the package
- demo-specific status rendering remains only in the playground, not in package defaults

## Test Plan
Add package-focused tests before considering internal publishing.

- Pure unit tests:
  - column normalization, order/sizing/visibility reconciliation
  - filter state normalization and advanced filter behavior
  - presentation rule normalization and matching
  - context-menu item preparation and adapter-driven hide/disable behavior
  - export/print payload construction without DOM assumptions

- Component tests:
  - renders with consumer-provided rows and columns only
  - selection modes, paging, filtering, and editable cells still work through the package entrypoint
  - AntD default adapter renders column settings and presentation modals correctly
  - package works with persistence disabled
  - package works with provided localStorage adapter
  - package works with provided async column preference adapter
  - package works with host-owned toolbar controls driving package state

- Consumer integration checks:
  - refactor the existing playground TanStack page to import the package instead of local implementation files
  - keep the toolbar in the playground wrapper and verify it controls the package through public props
  - build the app successfully with the package consumed as a workspace dependency
  - verify CSS is included through package import and not app-global leakage
  - verify no package source imports from `demoData`, `syncfusion-grid`, or app-local files

## Assumptions and Chosen Defaults
- The package stays in this repo for now as a first-party workspace package.
- The first package version includes the current default AntD grid UI, but not the toolbar.
- TypeScript is introduced for the package slice now to lock the public contract early.
- The goal is package-readiness and updateability, not immediate publishing.
- Backward compatibility with the current playground behavior is preserved unless a behavior is clearly demo-only.
