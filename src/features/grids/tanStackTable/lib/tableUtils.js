import { defaultContextMenuConfig } from './tableConfig';

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

export function copyText(value) {
  const text = String(value ?? '');

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
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

export function normalizeContextMenuConfig(contextMenuConfig = {}) {
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
      .map((column) => buildCsvValue(row.original[column.id]))
      .join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

export function downloadCsvFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildPrintableMarkup({ columns, rows: tableRows, title }) {
  const headerMarkup = columns
    .map((column) => `<th>${escapeHtml(column.columnDef.header ?? column.id)}</th>`)
    .join('');
  const colgroupMarkup = columns
    .map((column) => {
      const width = Number(column.getSize?.() ?? column.columnDef.size ?? 140);
      return `<col style="width: ${Math.max(72, Math.round(width))}px" />`;
    })
    .join('');

  const bodyMarkup = tableRows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(row.original[column.id])}</td>`)
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

export function openPrintWindow({ columns, rows: tableRows, title }) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.border = '0';

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 0);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.onafterprint = cleanup;
    frameWindow.focus();
    window.setTimeout(() => {
      frameWindow.print();
    }, 50);
  };

  document.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;

  if (!frameDocument) {
    cleanup();
    return;
  }

  frameDocument.open();
  frameDocument.write(buildPrintableMarkup({ columns, rows: tableRows, title }));
  frameDocument.close();
}
