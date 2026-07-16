# TanStack Grid

Komponent tabeli oparty na TanStack Table, przygotowany do stopniowego zastępowania
Syncfusion Grid. Pakiet zawiera domyślny interfejs Ant Design, obsługę tłumaczeń i
motywów portalu, preferencje kolumn, filtrowanie, paginację, selekcję, agregacje,
eksport, drukowanie, reguły prezentacji i menu kontekstowe.

## Wymagania

Docelowa, zweryfikowana konfiguracja portalu:

| Zależność | Wersja |
| --- | --- |
| `react` | `^18.3.1` |
| `react-dom` | `^18.3.1` |
| `antd` | `^5.26.0` |
| `@ant-design/icons` | `^5.6.1` |
| `@tanstack/react-table` | `^8.21.3` |

`react`, `react-dom`, `antd`, `@ant-design/icons` i `@tanstack/react-table` są
peer dependencies. Muszą być zainstalowane przez aplikację, dzięki czemu pakiet
nie tworzy drugiej instancji Reacta ani Ant Design.

Ważne: z AntD 5 należy używać `@ant-design/icons@5`. Wersja ikon 6 jest
przeznaczona dla AntD 6.

## 1. Lokalna instalacja do pilotażu

Skopiuj cały katalog pakietu do projektu docelowego, na przykład:

```text
portal/
├── package.json
├── src/
└── vendor/
    └── tanstack-grid/
        ├── package.json
        ├── README.md
        ├── src/
        ├── tsconfig.build.json
        └── vite.config.ts
```

Nie kopiuj pojedynczych komponentów z `src`. Pakiet powinien pozostać osobną
zależnością, żeby późniejsza zamiana na wersję publikowaną nie wymagała zmian
importów w ekranach.

Dodaj katalog grida jako lokalny npm workspace oraz lokalną zależność w
`package.json` portalu:

```json
{
  "workspaces": [
    "vendor/tanstack-grid"
  ],
  "dependencies": {
    "@react-grids-playground/tanstack-grid": "file:./vendor/tanstack-grid"
  }
}
```

Upewnij się, że portal posiada wymagane peer dependencies:

```bash
npm install react@^18.3.1 react-dom@^18.3.1 antd@^5.26.0 \
  @ant-design/icons@^5.6.1 @tanstack/react-table@^8.21.3
```

Zainstaluj wszystko jednym poleceniem z katalogu portalu, a następnie zbuduj
lokalny pakiet:

```bash
npm install
npm run build --workspace @react-grids-playground/tanstack-grid
```

Nie uruchamiaj osobnego `npm install` wewnątrz `vendor/tanstack-grid`. Workspace
powinien rozwiązać `react`, `react-dom`, AntD i pozostałe peer dependencies do
tych samych instancji, których używa portal. Osobne `node_modules` wewnątrz
pakietu może spowodować błąd `Invalid hook call`.

Po zmianie kodu grida podczas pilotażu uruchom ponownie:

```bash
npm run build --workspace @react-grids-playground/tanstack-grid
```

Jeżeli dev server nie zauważy zmiany lokalnej zależności, usuń wyłącznie cache
bundlera (np. `node_modules/.vite`) i uruchom go ponownie. Nie instaluj osobnej
kopii Reacta ręcznie wewnątrz aplikacji.

## 2. Import stylów

W głównym pliku uruchamiającym portal zaimportuj CSS pakietu dokładnie raz:

```tsx
import '@react-grids-playground/tanstack-grid/styles.css';
```

Import powinien znajdować się po bazowych stylach portalu, ale przed lokalnymi
nadpisaniami przeznaczonymi dla grida:

```tsx
import './styles/portal.css';
import '@react-grids-playground/tanstack-grid/styles.css';
import './styles/grid-overrides.css';
```

AntD 5 korzysta z CSS-in-JS, dlatego nie należy importować dawnego pliku
`antd/dist/antd.css`.

## 3. Globalny provider portalu

Dodaj `GridProvider` raz, możliwie wysoko w drzewie aplikacji. Wszystkie gridy
poniżej odziedziczą język, teksty, motyw, ustawienia domyślne i usługę preferencji
kolumn. Nie trzeba przekazywać tych wartości do każdego ekranu.

```tsx
import type { PropsWithChildren } from 'react';
import {
  GridProvider,
  enUS,
  plPL,
} from '@react-grids-playground/tanstack-grid';

const columnPreferences = {
  async load({ appId, gridId, languageCode, signal }) {
    const query = new URLSearchParams({
      appId: String(appId),
      gridId: String(gridId),
      languageCode: String(languageCode),
    });

    return apiClient.get(
      `/api/SysUserInfo/gridColumnsByUser?${query}`,
      { signal },
    );
  },

  async save({ appId, gridId, payload, signal }) {
    const query = new URLSearchParams({
      appId: String(appId),
      gridId: String(gridId),
    });

    return apiClient.put(
      `/api/SysUserInfo/gridColumnsByUser?${query}`,
      payload,
      { signal },
    );
  },

  async reset({ appId, gridId, signal }) {
    const query = new URLSearchParams({
      appId: String(appId),
      gridId: String(gridId),
    });

    return apiClient.delete(
      `/api/SysUserInfo/gridColumnsByUser?${query}`,
      { signal },
    );
  },
};

const themeTokens = {
  accent: 'var(--portal-accent)',
  accentSoft: 'var(--portal-accent-soft)',
  accentStrong: 'var(--portal-accent-hover)',
  background: 'var(--portal-background)',
  border: 'var(--portal-border)',
  surface: 'var(--portal-surface)',
  surfaceMuted: 'var(--portal-surface-muted)',
  text: 'var(--portal-text)',
  textMuted: 'var(--portal-text-muted)',
};

interface PortalGridProviderProps extends PropsWithChildren {
  locale: string;
}

export function PortalGridProvider({ children, locale }: PortalGridProviderProps) {
  return (
    <GridProvider
      columnPreferences={columnPreferences}
      labels={locale === 'pl-PL' ? plPL : enUS}
      locale={locale}
      themeTokens={themeTokens}
      defaults={{
        initialPageSize: 20,
        initialSelectionMode: 'multi',
        footerConfig: {
          showColumnsSettings: true,
          showExportExcel: true,
          showFilter: true,
          showPrint: true,
        },
      }}
    >
      {children}
    </GridProvider>
  );
}
```

Adapter powinien być zdefiniowany poza komponentem. Zapobiega to tworzeniu nowej
referencji przy każdym renderze i ponownemu pobieraniu kolumn.

`load` otrzymuje `appId`, `gridId`, bieżący `languageCode` oraz `AbortSignal`.
Zmiana języka lub identyfikatora automatycznie przeładowuje konfigurację. Adapter
powinien przekazać `signal` do klienta HTTP i nie wyświetlać komunikatu błędu dla
celowo anulowanego żądania.

Jeżeli portal korzysta z `react-intl`, można dodatkowo przekazać `formatMessage`.
Nie jest to wymagane: pakiet zawiera kompletne zestawy `plPL` i `enUS`.

Umieść provider wewnątrz istniejących providerów portalu:

```tsx
<AntdConfigProvider theme={portalAntdTheme}>
  <PortalI18nProvider>
    <PortalGridProvider locale={locale}>
      <App />
    </PortalGridProvider>
  </PortalI18nProvider>
</AntdConfigProvider>
```

## 4. Minimalny grid na ekranie

Wariant z kolumnami pobieranymi z API wymaga tylko danych i dwóch identyfikatorów:

```tsx
import { TanStackGrid } from '@react-grids-playground/tanstack-grid';

export function DocumentsGrid({ documents }) {
  return (
    <TanStackGrid
      appId={7}
      gridId={29}
      rowIdField="documentId"
      rows={documents}
    />
  );
}
```

Jeżeli pobieranie kolumn zakończy się błędem albo zwróci pustą tablicę, grid użyje
`columns`/`defaultColumns` jako konfiguracji awaryjnej:

```tsx
const fallbackColumns = [
  {
    field: 'documentId',
    headerText: 'ID',
    isPrimaryKey: true,
    visible: false,
  },
  {
    field: 'documentNumber',
    headerText: 'Numer dokumentu',
    width: 180,
  },
  {
    field: 'amount',
    headerText: 'Kwota',
    width: 140,
  },
];

<TanStackGrid
  appId={7}
  columns={fallbackColumns}
  gridId={29}
  rowIdField="documentId"
  rows={documents}
/>
```

Odpowiedź `load` może być tablicą kolumn albo obiektem w jednym z formatów:

```ts
Column[]
{ columns: Column[] }
{ data: Column[] }
```

Najczęściej używane pola definicji kolumny:

```ts
{
  field: 'documentNumber',
  alias: 'documentNumber',
  headerText: 'Numer dokumentu',
  width: 180,
  visible: true,
  allowFiltering: true,
  allowSorting: true,
  allowEditing: false,
  isPrimaryKey: false,
}
```

## 5. Grid bez konfiguracji serwerowej

Jeśli ekran nie ma `appId`/`gridId`, przekaż lokalne kolumny. Provider nie wykona
wtedy żądania o konfigurację:

```tsx
<TanStackGrid
  columns={columns}
  fetchColumns={false}
  rowIdField="id"
  rows={rows}
/>
```

Lokalny adapter przekazany w `columnPreferences` na konkretnym gridzie nadpisuje
adapter globalny. Analogicznie propsy `locale`, `labels`, `themeTokens`, `defaults`
i `components` nadpisują wartości providera.

## 6. Identyfikacja i selekcja wierszy

Identyfikator wiersza jest wybierany w następującej kolejności:

1. wynik `getRowId(row, index)`;
2. pole wskazane przez `rowIdField`;
3. kolumna jawnie oznaczona przez API jako `isPrimaryKey: true`;
4. pole `id`, `ID` albo `Id`;
5. indeks TanStack jako rozwiązanie awaryjne.

Dla danych odświeżanych, sortowanych lub edytowanych zawsze ustaw `rowIdField`
albo `getRowId`. Indeks nie powinien być używany jako trwały identyfikator danych.

```tsx
<TanStackGrid
  getRowId={(row) => `${row.companyId}:${row.documentId}`}
  onSelectionChange={(selectedRows, { ids }) => {
    setSelectedDocumentIds(ids);
  }}
  rows={rows}
  columns={columns}
/>
```

## 7. Renderery komórek

Do nowych ekranów używaj neutralnych rendererów zamiast template'ów Syncfusion:

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
      approved: createBooleanRenderer({ label: 'Zatwierdzony' }),
      invoiceDate: createDateRenderer({ locale: 'pl-PL' }),
      netAmount: createNumberRenderer({
        locale: 'pl-PL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      status: ({ row, value }) => (
        <StatusBadge status={String(value)} document={row} />
      ),
    },
  }}
/>
```

Klucz renderera musi odpowiadać `field`/`alias` kolumny.

## 8. Menu kontekstowe

Menu może być stałą tablicą albo funkcją budującą elementy na podstawie komórki:

```tsx
<TanStackGrid
  columns={columns}
  rows={rows}
  contextMenuConfig={{
    cellItems: ({ row, rowId, columnId, value }) => [
      {
        key: 'open',
        label: 'Otwórz dokument',
        onSelect: () => openDocument(row),
      },
      {
        key: 'copy',
        label: 'Kopiuj wartość',
        onSelect: () => navigator.clipboard.writeText(String(value ?? '')),
      },
      {
        key: 'delete',
        label: 'Usuń',
        disabled: !row?.canDelete,
        separator: true,
        onSelect: () => deleteDocument(rowId),
      },
    ],
  }}
/>
```

Kontekst zawiera surowy `row`, `rowId`, `columnId`, `value`, `displayValue` oraz
`target` (`cell` albo `header`). Elementy obsługują `icon`, podmenu `items`,
`disabled`, `separator` i `onSelect`.

## 9. Konfiguracja funkcji i stopki

Funkcje można ustawić globalnie w `GridProvider.defaults` albo lokalnie:

```tsx
<TanStackGrid
  columns={columns}
  rows={rows}
  features={{
    columnSettings: true,
    contextMenu: true,
    export: true,
    filtering: true,
    pagination: true,
    presentation: false,
    print: true,
    selection: true,
    summary: true,
  }}
  footerConfig={{
    showFooter: true,
    showColumnsSettings: true,
    showExportExcel: true,
    showFilter: true,
    showPrint: true,
    showSummary: true,
  }}
/>
```

## 10. Ref imperatywny

Ref jest przeznaczony dla istniejących ekranów, które muszą wykonywać operacje z
zewnętrznego toolbara. Preferuj propsy i callbacki, jeśli dana operacja może być
obsłużona deklaratywnie.

```tsx
import { useRef } from 'react';
import { TanStackGrid } from '@react-grids-playground/tanstack-grid';
import type { TanStackGridRef } from '@react-grids-playground/tanstack-grid';

export function DocumentsGrid({ columns, rows }) {
  const gridRef = useRef<TanStackGridRef<DocumentRow>>(null);

  return (
    <>
      <button type="button" onClick={() => gridRef.current?.printSelected()}>
        Drukuj zaznaczone
      </button>
      <TanStackGrid ref={gridRef} rows={rows} columns={columns} />
    </>
  );
}
```

## 11. Migracja ze Syncfusion

Zalecana kolejność migracji pojedynczego ekranu:

1. dodaj lokalny pakiet, CSS i globalny provider;
2. pozostaw istniejące pobieranie danych ekranu;
3. zamień komponent Syncfusion na `TanStackGridCompat` i sprawdź podstawowy widok;
4. dodaj stabilne `rowIdField`;
5. podłącz `appId` i `gridId`, a następnie sprawdź pobieranie, zapis i reset kolumn;
6. przenieś template'y do `slots.cellRenderers`;
7. przenieś menu do `contextMenuConfig`;
8. zastąp `TanStackGridCompat` właściwym `TanStackGrid`;
9. usuń importy komponentów i CSS Syncfusion z migrowanego ekranu;
10. przetestuj języki, motywy, selekcję, filtry, paginację, eksport i drukowanie.

`TanStackGridCompat` jest wyłącznie pomostem migracyjnym. Nowe ekrany powinny od
razu korzystać z `TanStackGrid`, `slots` oraz `contextMenuConfig`.

## 12. Zamiana lokalnego pakietu na publikowaną zależność

Podczas pilotażu zachowaj docelową nazwę pakietu we wszystkich importach. Po
publikacji zmień tylko wpis w `package.json`:

```diff
- "@react-grids-playground/tanstack-grid": "file:./vendor/tanstack-grid"
+ "@react-grids-playground/tanstack-grid": "^1.0.0"
```

Następnie usuń katalog `vendor/tanstack-grid` i wykonaj czystą instalację
zależności. Kod ekranów i provider nie powinny wymagać zmian.

## 13. Diagnostyka

### Grid nie ma stylów

Sprawdź, czy aplikacja importuje:

```tsx
import '@react-grids-playground/tanstack-grid/styles.css';
```

### `Invalid hook call` albo błędy kontekstu React

Sprawdź `npm ls react react-dom`. Aplikacja i grid muszą korzystać z tej samej
instancji Reacta. React pozostaje peer dependency pakietu.

### Brak kolumn

Sprawdź kolejno:

- czy przekazano jednocześnie `appId` i `gridId`;
- czy `PortalGridProvider` znajduje się nad ekranem;
- czy odpowiedź API jest tablicą, `{ columns: [] }` albo `{ data: [] }`;
- czy klient HTTP przekazuje `AbortSignal`;
- czy `columns` zawiera konfigurację awaryjną.

### Zaznaczenie przechodzi na inny rekord

Ustaw `rowIdField` na unikalne i stabilne pole rekordu. Nie polegaj na indeksie,
jeżeli kolejność danych może się zmienić.

### Konflikt AntD i ikon

Dla portalu z AntD `5.26.x` wynik `npm ls` powinien wskazywać AntD 5 oraz
`@ant-design/icons` 5. Nie instaluj `@ant-design/icons@6` z AntD 5.

## 14. Kontrola przed przekazaniem ekranu do testów

- brak importów Syncfusion na zmigrowanym ekranie;
- unikalne `appId`, `gridId` i `rowIdField`;
- działający fallback lokalnych kolumn;
- pobieranie, zapis i reset kolumn sprawdzone na backendzie;
- zmiana PL/EN bez przeładowania strony;
- jasny i ciemny motyw;
- pojedyncza i wielokrotna selekcja;
- filtry, sortowanie i paginacja;
- menu kontekstowe z właściwym rekordem;
- eksport i drukowanie;
- brak błędów i ostrzeżeń w konsoli;
- test produkcyjnego builda, a nie wyłącznie dev servera.
