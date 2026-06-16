import { defaultContextMenuConfig, MIN_COLUMN_WIDTH } from './tableConfig';
import { getColumnDisplayText } from './tableDisplay';

export function reorderItems(items, activeId, overId) {
  const getItemId = (item) => (typeof item === 'string' ? item : item.id);
  const activeIndex = items.findIndex((item) => getItemId(item) === activeId);
  const overIndex = items.findIndex((item) => getItemId(item) === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return items;
  }

  const reorderedItems = [...items];
  const [activeItem] = reorderedItems.splice(activeIndex, 1);
  reorderedItems.splice(overIndex, 0, activeItem);

  return reorderedItems;
}

export function mergeClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

export function getResolvedProps(propGetter, context) {
  return typeof propGetter === 'function' ? propGetter(context) ?? {} : {};
}

export function callOptionalHandler(handler, event, context) {
  if (typeof handler === 'function') {
    handler(event, context);
  }
}

export function normalizeContextMenuConfig(contextMenuConfig: {
  disabledMap?: Record<string, unknown>;
  hiddenMap?: Record<string, unknown>;
  labels?: Record<string, string>;
  [key: string]: unknown;
} = {}) {
  return {
    ...defaultContextMenuConfig,
    ...contextMenuConfig,
    disabledMap: {
      ...defaultContextMenuConfig.disabledMap,
      ...(contextMenuConfig.disabledMap ?? {}),
    },
    hiddenMap: {
      ...defaultContextMenuConfig.hiddenMap,
      ...(contextMenuConfig.hiddenMap ?? {}),
    },
    labels: {
      ...defaultContextMenuConfig.labels,
      ...(contextMenuConfig.labels ?? {}),
    },
  };
}

export function resolveContextMenuRule(rule, item, menuState) {
  return typeof rule === 'function' ? rule({ item, menuState }) : Boolean(rule);
}

export function prepareContextMenuItems(items, menuState, contextMenuConfig) {
  const normalizedConfig = normalizeContextMenuConfig(contextMenuConfig);

  return items
    .map((item) => {
      const hiddenRule = normalizedConfig.hiddenMap[item.key];

      if (resolveContextMenuRule(hiddenRule, item, menuState)) {
        return null;
      }

      const disabledRule = normalizedConfig.disabledMap[item.key];
      const nextItem = {
        ...item,
        disabled: item.disabled || resolveContextMenuRule(disabledRule, item, menuState),
        label: normalizedConfig.labels[item.key] ?? item.label,
      };

      if (Array.isArray(nextItem.items)) {
        nextItem.items = prepareContextMenuItems(nextItem.items, menuState, normalizedConfig);
      }

      return nextItem;
    })
    .filter(Boolean);
}

export function normalizeCustomContextMenuItems(items, menuState) {
  const customItems = typeof items === 'function' ? items(menuState) : items;
  return Array.isArray(customItems) ? customItems : [];
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function buildCsvContent(columns, tableRows) {
  const headerRow = columns.map((column) => buildCsvValue(column.columnDef.header ?? column.id)).join(',');
  const dataRows = tableRows.map((row) =>
    columns
      .map((column) => buildCsvValue(getColumnDisplayText(column, row.original[column.id], 'export')))
      .join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

export function buildPrintableMarkup({ columns, rows: tableRows, title }) {
  const headerMarkup = columns
    .map((column) => `<th>${escapeHtml(column.columnDef.header ?? column.id)}</th>`)
    .join('');
  const colgroupMarkup = columns
    .map((column) => {
      const width = Number(column.getSize?.() ?? column.columnDef.size ?? 140);
      return `<col style="width: ${Math.max(MIN_COLUMN_WIDTH, Math.round(width))}px" />`;
    })
    .join('');

  const bodyMarkup = tableRows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(getColumnDisplayText(column, row.original[column.id], 'print'))}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            margin: 24px;
            font-family: "Avenir Next", "Segoe UI", sans-serif;
            color: #231d18;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 20px;
          }

          p {
            margin: 0 0 16px;
            color: #625649;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th,
          td {
            padding: 10px 12px;
            border: 1px solid #d8cdc0;
            text-align: left;
          }

          th {
            background: #f4ede3;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${tableRows.length} rows</p>
        <table>
          <colgroup>${colgroupMarkup}</colgroup>
          <thead>
            <tr>${headerMarkup}</tr>
          </thead>
          <tbody>${bodyMarkup}</tbody>
        </table>
      </body>
    </html>
  `;
}
