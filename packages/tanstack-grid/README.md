# TanStack Grid

## Portal integration

Add `GridProvider` once near the portal root. Grids below it inherit locale, labels,
theme tokens, UI components, defaults, and the portal column-preferences service.

```tsx
import { GridProvider, plPL } from '@react-grids-playground/tanstack-grid';

<GridProvider
  columnPreferences={{
    load: ({ appId, gridId, languageCode, signal }) =>
      api.getColumns({ appId, gridId, languageCode, signal }),
    save: ({ appId, gridId, payload, signal }) =>
      api.saveColumns({ appId, gridId, payload, signal }),
    reset: ({ appId, gridId, signal }) =>
      api.resetColumns({ appId, gridId, signal }),
  }}
  labels={plPL}
  locale="pl-PL"
  themeTokens={{
    accent: 'var(--portal-accent)',
    surface: 'var(--portal-surface)',
    text: 'var(--portal-text)',
  }}
>
  <Portal />
</GridProvider>
```

When a provider adapter and both identifiers are available, columns load automatically:

```tsx
<TanStackGrid appId={7} gridId={29} rows={rows} />
```

The load context contains `appId`, `gridId`, `languageCode`, and an `AbortSignal`.
Changing locale or either identifier reloads columns. Local `columnPreferences` and
grid props override provider values. With no adapter, local `columns` continue to work.

Only pass `formatMessage` when the portal catalog contains `tanstackGrid.*` keys.
The bundled `enUS` and `plPL` labels work without an external message catalog.

## Stable row identity

Row identity is resolved in this order:

1. `rowIdField`;
2. a column explicitly marked `isPrimaryKey` by the column service;
3. `id`, `ID`, or `Id` on the row;
4. the stable TanStack row index fallback.

For server-updated or reorderable data, prefer an explicit identity:

```tsx
<TanStackGrid rowIdField="documentId" rows={rows} columns={columns} />
```

## Renderers and context menu

Use vendor-neutral slots instead of importing Syncfusion templates:

```tsx
import {
  createBooleanRenderer,
  createDateRenderer,
  createNumberRenderer,
  TanStackGrid,
} from '@react-grids-playground/tanstack-grid';

<TanStackGrid
  columns={columns}
  rows={rows}
  slots={{
    cellRenderers: {
      approved: createBooleanRenderer({ label: 'Approved' }),
      invoiceDate: createDateRenderer({ locale: 'pl-PL' }),
      netAmount: createNumberRenderer({
        locale: 'pl-PL',
        minimumFractionDigits: 2,
      }),
    },
  }}
  contextMenuConfig={{
    cellItems: ({ row }) => [{
      key: 'edit',
      label: 'Edit row',
      onSelect: () => editRow(row),
    }],
  }}
/>
```

Context-menu items accept React `icon` nodes, nested items, dynamic factories, and
hide/disable rules. Action context includes the raw row, row id, column id, target,
and cell value.

## Migration

`TanStackGridCompat` accepts the most common Syncfusion-style props and is intended
only for incremental migration. New and migrated screens should converge on
`TanStackGrid`, neutral slots, and `contextMenuConfig` so Syncfusion and its CSS can
be removed after the last legacy screen is migrated.
