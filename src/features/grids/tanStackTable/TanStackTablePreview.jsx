import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatusBadge } from '../../demoData/StatusBadge';
import { getDemoRows } from '../../demoData';
import { Button, Dropdown, Empty, Tag } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { GridColumnsModal } from '../../../shared/components/grid/GridColumnsModal';
import { GridFooter } from '../../../shared/components/grid/GridFooter';
import { GridSummaryBar } from '../../../shared/components/grid/GridSummaryBar';
import { GridTemplateEditorModal } from '../../../shared/components/grid/GridTemplateEditorModal';
import { buildGridFooterButtons } from '../../../shared/components/grid/buildGridFooterButtons';

const initialRows = getDemoRows();
const exportableFieldIds = ['id', 'owner', 'region', 'status', 'revenue', 'updatedAt'];
const tableColumnStateKey = 'tanstack-table-preview-column-state-v1';
const presentationRulesStateKey = 'tanstack-table-preview-presentation-rules-v1';
const defaultPresentationRules = [
  {
    id: 'default-live-row',
    name: 'Live campaigns',
    enabled: true,
    target: 'row',
    field: 'status',
    operator: 'equals',
    value: 'Live',
    decoration: 'success',
  },
  {
    id: 'default-review-status',
    name: 'Review status cells',
    enabled: true,
    target: 'cell',
    field: 'status',
    operator: 'equals',
    value: 'Review',
    decoration: 'warning',
    backgroundColor: '#fff4d6',
    cellDisplay: 'pill',
    textColor: '#8a5a12',
  },
  {
    id: 'default-high-revenue',
    name: 'High revenue cells',
    enabled: true,
    target: 'cell',
    field: 'revenue',
    operator: 'greaterThan',
    value: '120000',
    decoration: 'info',
    cellDisplay: 'dot',
  },
  {
    id: 'default-region-header',
    name: 'Region header',
    enabled: true,
    target: 'header',
    field: 'region',
    operator: 'equals',
    value: '',
    decoration: 'accent',
  },
];
const presentationRuleTargets = new Set(['cell', 'row', 'header']);
const presentationRuleOperators = new Set([
  'contains',
  'equals',
  'notEquals',
  'startsWith',
  'endsWith',
  'greaterThan',
  'lessThan',
  'empty',
  'notEmpty',
]);
const presentationRuleDecorations = new Set(['success', 'warning', 'info', 'accent', 'muted']);
const presentationRuleCellDisplays = new Set(['value', 'dot', 'check', 'cross', 'booleanIcon', 'pill']);
const decorationAccentColors = {
  accent: 'var(--accent)',
  info: 'var(--info)',
  muted: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};

function buildUniqueOptions(field) {
  return [...new Set(initialRows.map((row) => row[field]))];
}

const baseColumns = [
  {
    accessorKey: 'id',
    header: 'Campaign',
    size: 150,
    meta: {
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    size: 180,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'region',
    header: 'Region',
    filterFn: 'equalsString',
    size: 160,
    meta: {
      editable: true,
      filterOptions: buildUniqueOptions('region'),
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equalsString',
    size: 150,
    meta: {
      editable: true,
      filterOptions: buildUniqueOptions('status'),
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    size: 140,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    size: 140,
    meta: {
      editable: true,
      filterVariant: 'text',
    },
  },
];

const defaultColumnOrder = ['select', ...baseColumns.map((column) => column.accessorKey)];
const defaultColumnSizing = {
  select: 72,
  ...Object.fromEntries(baseColumns.map((column) => [column.accessorKey, column.size])),
};

function normalizeColumnOrder(columnOrder) {
  const validColumnIds = new Set(defaultColumnOrder);
  const persistedOrder = Array.isArray(columnOrder)
    ? columnOrder.filter((columnId) => validColumnIds.has(columnId) && columnId !== 'select')
    : [];
  const missingColumnIds = defaultColumnOrder.filter(
    (columnId) => columnId !== 'select' && !persistedOrder.includes(columnId),
  );

  return ['select', ...persistedOrder, ...missingColumnIds];
}

function readColumnState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(tableColumnStateKey) ?? '{}');
  } catch {
    return {};
  }
}

function writeColumnState(columnState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(tableColumnStateKey, JSON.stringify(columnState));
}

function cloneDefaultPresentationRules() {
  return defaultPresentationRules.map((rule) => ({ ...rule }));
}

function createPresentationRule(overrides = {}) {
  const ruleId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `presentation-rule-${Date.now()}`;

  return {
    id: ruleId,
    name: 'New rule',
    enabled: true,
    target: 'cell',
    field: 'status',
    operator: 'equals',
    value: 'Live',
    decoration: 'info',
    backgroundColor: '',
    cellDisplay: 'value',
    textColor: '',
    ...overrides,
  };
}

function normalizeColorValue(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? value : '';
}

function normalizePresentationRule(rule, index = 0) {
  const target = presentationRuleTargets.has(rule?.target) ? rule.target : 'cell';
  const operator = presentationRuleOperators.has(rule?.operator) ? rule.operator : 'equals';
  const decoration = presentationRuleDecorations.has(rule?.decoration) ? rule.decoration : 'info';
  const cellDisplay = presentationRuleCellDisplays.has(rule?.cellDisplay) ? rule.cellDisplay : 'value';

  return {
    id: rule?.id ?? `presentation-rule-${index}`,
    name: String(rule?.name || `Rule ${index + 1}`),
    enabled: rule?.enabled !== false,
    target,
    field: String(rule?.field || 'status'),
    operator: target === 'header' ? 'equals' : operator,
    value: String(rule?.value ?? ''),
    decoration,
    backgroundColor: normalizeColorValue(rule?.backgroundColor),
    cellDisplay: target === 'cell' ? cellDisplay : 'value',
    textColor: normalizeColorValue(rule?.textColor),
  };
}

function normalizePresentationRules(rules) {
  if (!Array.isArray(rules)) {
    return cloneDefaultPresentationRules();
  }

  return rules.map((rule, index) => normalizePresentationRule(rule, index));
}

function readPresentationRules() {
  if (typeof window === 'undefined') {
    return cloneDefaultPresentationRules();
  }

  try {
    const storedRules = JSON.parse(window.localStorage.getItem(presentationRulesStateKey) ?? 'null');
    return storedRules === null ? cloneDefaultPresentationRules() : normalizePresentationRules(storedRules);
  } catch {
    return cloneDefaultPresentationRules();
  }
}

function writePresentationRules(rules) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(presentationRulesStateKey, JSON.stringify(rules));
}

function parseCurrency(value) {
  const numericValue = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function getRevenueAggregates(tableRows) {
  const values = tableRows.map((row) => parseCurrency(row.original.revenue));
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length > 0 ? total / values.length : 0;

  return [
    { label: 'Sum', value: formatCurrency(total) },
    { label: 'Average', value: formatCurrency(average) },
    { label: 'Min', value: formatCurrency(values.length > 0 ? Math.min(...values) : 0) },
    { label: 'Max', value: formatCurrency(values.length > 0 ? Math.max(...values) : 0) },
  ];
}

function getCellValue(row, columnId) {
  return row?.original?.[columnId] ?? '';
}

function matchesPresentationRule(rule, { columnId, row, target }) {
  if (!rule.enabled || rule.target !== target) {
    return false;
  }

  if (target === 'header') {
    return rule.field === columnId;
  }

  if (!row) {
    return false;
  }

  if (target === 'cell' && rule.field !== columnId) {
    return false;
  }

  const actualValue = String(getCellValue(row, rule.field) ?? '').trim();
  const expectedValue = String(rule.value ?? '').trim();
  const normalizedActual = actualValue.toLowerCase();
  const normalizedExpected = expectedValue.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return normalizedActual === normalizedExpected;
    case 'notEquals':
      return normalizedActual !== normalizedExpected;
    case 'startsWith':
      return normalizedActual.startsWith(normalizedExpected);
    case 'endsWith':
      return normalizedActual.endsWith(normalizedExpected);
    case 'greaterThan':
      return parseCurrency(actualValue) > parseCurrency(expectedValue);
    case 'lessThan':
      return parseCurrency(actualValue) < parseCurrency(expectedValue);
    case 'empty':
      return actualValue.length === 0;
    case 'notEmpty':
      return actualValue.length > 0;
    case 'contains':
    default:
      return normalizedActual.includes(normalizedExpected);
  }
}

function getMatchingPresentationRule(rules, context) {
  return rules.find((rule) => matchesPresentationRule(rule, context));
}

function getPresentationClassName(target, rule) {
  return rule ? `tanstack-grid__presentation-${target}--${rule.decoration}` : '';
}

function getPresentationTooltip(rule) {
  return rule ? `Presentation rule: ${rule.name}` : undefined;
}

function getPresentationStyle(rule) {
  if (!rule) {
    return {};
  }

  return {
    ...(rule.backgroundColor ? { backgroundColor: rule.backgroundColor } : {}),
    ...(rule.textColor ? { color: rule.textColor } : {}),
  };
}

function getPresentationAccent(rule) {
  return rule?.textColor || decorationAccentColors[rule?.decoration] || 'var(--accent)';
}

function isTruthyDisplayValue(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());
}

function reorderItems(items, activeId, overId) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return items;
  }

  const reorderedItems = [...items];
  const [activeItem] = reorderedItems.splice(activeIndex, 1);
  reorderedItems.splice(overIndex, 0, activeItem);

  return reorderedItems;
}

function copyText(value) {
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

function renderHighlightedText(value, searchTerm) {
  const text = value == null ? '' : String(value);
  const normalizedSearch = searchTerm?.trim();

  if (!normalizedSearch) {
    return text;
  }

  const escapedTerm = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedSearch.toLowerCase() ? (
      <mark className="search-highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function renderPresentationCellContent(cellContent, rule, rawValue) {
  if (!rule || rule.cellDisplay === 'value') {
    return (
      <>
        <div className="tanstack-grid__cell-value">{cellContent}</div>
        {rule ? (
          <span
            aria-hidden="true"
            className="tanstack-grid__decoration-icon"
            style={{ '--presentation-accent': getPresentationAccent(rule) }}
          />
        ) : null}
      </>
    );
  }

  if (rule.cellDisplay === 'pill') {
    return (
      <span
        className="tanstack-grid__replacement tanstack-grid__replacement--pill"
        style={{ '--presentation-accent': getPresentationAccent(rule) }}
      >
        {String(rawValue ?? '') || 'Empty'}
      </span>
    );
  }

  if (rule.cellDisplay === 'booleanIcon') {
    const isTruthy = isTruthyDisplayValue(rawValue);

    return (
      <span
        aria-label={isTruthy ? 'True' : 'False'}
        className="tanstack-grid__replacement tanstack-grid__replacement--mark"
        style={{ '--presentation-accent': rule.textColor || (isTruthy ? 'var(--success)' : '#b42318') }}
      >
        {isTruthy ? '✓' : '×'}
      </span>
    );
  }

  if (rule.cellDisplay === 'check' || rule.cellDisplay === 'cross') {
    const isCheck = rule.cellDisplay === 'check';

    return (
      <span
        aria-label={isCheck ? 'Check mark' : 'Cross mark'}
        className="tanstack-grid__replacement tanstack-grid__replacement--mark"
        style={{ '--presentation-accent': getPresentationAccent(rule) }}
      >
        {isCheck ? '✓' : '×'}
      </span>
    );
  }

  return (
    <span
      aria-label={String(rawValue ?? '')}
      className="tanstack-grid__replacement tanstack-grid__replacement--dot"
      style={{ '--presentation-accent': getPresentationAccent(rule) }}
    />
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildCsvContent(columns, tableRows) {
  const headerRow = columns.map((column) => buildCsvValue(column.columnDef.header ?? column.id)).join(',');
  const dataRows = tableRows.map((row) =>
    columns
      .map((column) => buildCsvValue(row.original[column.id]))
      .join(','),
  );

  return [headerRow, ...dataRows].join('\n');
}

function downloadCsvFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPrintableMarkup({ columns, rows: tableRows, title }) {
  const headerMarkup = columns
    .map((column) => `<th>${escapeHtml(column.columnDef.header ?? column.id)}</th>`)
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
          <thead>
            <tr>${headerMarkup}</tr>
          </thead>
          <tbody>${bodyMarkup}</tbody>
        </table>
      </body>
    </html>
  `;
}

function openPrintWindow({ columns, rows: tableRows, title }) {
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

function TableCheckbox({ checked, indeterminate = false, ...props }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate && !checked;
    }
  }, [checked, indeterminate]);

  return <input checked={checked} ref={inputRef} type="checkbox" {...props} />;
}

function ContextMenuItemButton({ item, onSelect }) {
  if (item.separator) {
    return <div className="tanstack-grid__context-menu-separator" role="separator" />;
  }

  const hasSubmenu = item.items?.length > 0;

  return (
    <div className="tanstack-grid__context-menu-item-wrap">
      <button
        className="tanstack-grid__context-menu-item"
        disabled={item.disabled}
        onClick={() => {
          if (!hasSubmenu) {
            onSelect(item);
          }
        }}
        type="button"
      >
        <span>{item.label}</span>
        {item.meta ? <span className="tanstack-grid__context-menu-meta">{item.meta}</span> : null}
        {hasSubmenu ? <span className="tanstack-grid__context-menu-arrow">›</span> : null}
      </button>

      {hasSubmenu ? (
        <div className="tanstack-grid__context-submenu" role="menu">
          {item.items.map((childItem) => (
            <ContextMenuItemButton item={childItem} key={childItem.key} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ContextMenu({ items, onClose, onSelect, state }) {
  if (!state) {
    return null;
  }

  return createPortal(
    <div
      className={`tanstack-grid__context-menu ${
        state.submenuPlacement === 'left' ? 'tanstack-grid__context-menu--submenu-left' : ''
      }`.trim()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
      style={{
        left: state.x,
        top: state.y,
      }}
    >
      <div className="tanstack-grid__context-menu-title">{state.label}</div>
      {items.map((item) => (
        <ContextMenuItemButton item={item} key={item.key} onSelect={onSelect} />
      ))}
      <button className="tanstack-grid__context-menu-close" onClick={onClose} type="button">
        Close
      </button>
    </div>,
    document.body,
  );
}

function EditableCell({ column, getValue, renderPreview, row, searchTerm, table }) {
  const value = getValue() ?? '';
  const columnMeta = column.columnDef.meta ?? {};
  const showSearchPreview = !renderPreview && Boolean(searchTerm?.trim());

  if (!columnMeta.editable) {
    return renderPreview ? renderPreview(value, searchTerm) : renderHighlightedText(value, searchTerm);
  }

  function updateValue(nextValue) {
    table.options.meta?.updateData?.(row.original.id, column.id, nextValue);
  }

  return (
    <div className="tanstack-grid__editable-cell">
      {renderPreview ? (
        <span className="tanstack-grid__editable-preview">{renderPreview(value, searchTerm)}</span>
      ) : showSearchPreview ? (
        <span className="tanstack-grid__editable-preview">{renderHighlightedText(value, searchTerm)}</span>
      ) : null}
      {columnMeta.filterVariant === 'select' ? (
        <select
          aria-label={`Edit ${column.columnDef.header}`}
          onChange={(event) => updateValue(event.target.value)}
          value={value}
        >
          {columnMeta.filterOptions?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-label={`Edit ${column.columnDef.header}`}
          onChange={(event) => updateValue(event.target.value)}
          type="text"
          value={value}
        />
      )}
    </div>
  );
}

export function TanStackTablePreview() {
  const persistedColumnState = useMemo(readColumnState, []);
  const [tableData, setTableData] = useState(() => initialRows);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilterDraft, setGlobalFilterDraft] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [selectionMode, setSelectionMode] = useState('multi');
  const [selectedRowsReport, setSelectedRowsReport] = useState([]);
  const [columnOrder, setColumnOrder] = useState(() =>
    normalizeColumnOrder(persistedColumnState.columnOrder),
  );
  const [columnSizing, setColumnSizing] = useState(() => ({
    ...defaultColumnSizing,
    ...(persistedColumnState.columnSizing ?? {}),
  }));
  const [columnVisibility, setColumnVisibility] = useState(
    () => persistedColumnState.columnVisibility ?? {},
  );
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [showAllRows, setShowAllRows] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [aggregationScope, setAggregationScope] = useState('page');
  const [lastDoubleClickedRow, setLastDoubleClickedRow] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [presentationRules, setPresentationRules] = useState(readPresentationRules);

  useEffect(() => {
    setRowSelection({});
  }, [selectionMode]);

  useEffect(() => {
    writeColumnState({
      columnOrder,
      columnSizing,
      columnVisibility,
    });
  }, [columnOrder, columnSizing, columnVisibility]);

  useEffect(() => {
    writePresentationRules(presentationRules);
  }, [presentationRules]);

  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0
        ? current
        : {
            ...current,
            pageIndex: 0,
          },
    );
  }, [columnFilters, globalFilter]);

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    function closeContextMenu() {
      setContextMenu(null);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    }

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [contextMenu]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        enableHiding: false,
        enableColumnFilter: false,
        enableSorting: false,
        size: defaultColumnSizing.select,
        header: ({ table }) =>
          selectionMode === 'multi' ? (
            <TableCheckbox
              aria-label="Select all rows"
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          ) : (
            <span>Select</span>
          ),
        cell: ({ row }) =>
          selectionMode === 'multi' ? (
            <TableCheckbox
              aria-label={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          ) : (
            <input
              aria-label={`Select ${row.original.id}`}
              checked={row.getIsSelected()}
              name="tanstack-selection"
              onChange={row.getToggleSelectedHandler()}
              type="radio"
            />
          ),
      },
      ...baseColumns.map((column) => ({
        ...column,
        cell:
          column.accessorKey === 'status'
            ? (cellContext) => (
                <EditableCell
                  {...cellContext}
                  renderPreview={(value, searchTerm) => (
                    <StatusBadge value={value}>{renderHighlightedText(value, searchTerm)}</StatusBadge>
                  )}
                  searchTerm={globalFilter}
                />
              )
            : (cellContext) => (
                <EditableCell
                  {...cellContext}
                  searchTerm={globalFilter}
                />
              ),
      })),
    ],
    [globalFilter, selectionMode],
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableMultiRowSelection: selectionMode === 'multi',
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    meta: {
      updateData: (rowId, columnId, value) => {
        setTableData((currentRows) =>
          currentRows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)),
        );
      },
    },
    state: {
      columnFilters,
      columnOrder,
      columnSizing,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
      sorting,
    },
  });

  const matchingRows = table.getPrePaginationRowModel().rows;
  const visibleRows = showAllRows ? matchingRows : table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;
  const aggregateRows = aggregationScope === 'filtered' ? matchingRows : visibleRows;
  const revenueAggregates = getRevenueAggregates(aggregateRows);
  const visibleExportColumns = table
    .getVisibleLeafColumns()
    .filter((column) => exportableFieldIds.includes(column.id));
  const activeColumnFilters = columnFilters.filter((filter) => String(filter.value ?? '').trim()).length;
  const activePresentationRules = presentationRules.filter((rule) => rule.enabled).length;

  useEffect(() => {
    setSelectedRowsReport(table.getSelectedRowModel().rows.map((row) => row.original.id));
  }, [rowSelection, selectionMode, tableData]);

  function applySearch(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setGlobalFilter(globalFilterDraft.trim());
    table.setPageIndex(0);
  }

  function clearSearch() {
    setGlobalFilterDraft('');
    setGlobalFilter('');
    table.setPageIndex(0);
  }

  function updateColumnFilter(columnId, value) {
    const column = table.getColumn(columnId);
    const normalizedValue = typeof value === 'string' ? value : String(value ?? '');
    column?.setFilterValue(normalizedValue.trim() ? normalizedValue : undefined);
  }

  function clearColumnFilters() {
    setColumnFilters([]);
  }

  function exportFilteredRows() {
    const csvContent = buildCsvContent(visibleExportColumns, matchingRows);
    downloadCsvFile('tanstack-table-export.csv', csvContent);
  }

  function printRows(mode) {
    const printableRows =
      mode === 'selected' ? selectedRows : mode === 'all' ? matchingRows : visibleRows;

    if (printableRows.length === 0) {
      return;
    }

    const printTitle =
      mode === 'selected'
        ? 'TanStack Table - Selected Rows'
        : mode === 'all'
          ? 'TanStack Table - All Filtered Rows'
          : 'TanStack Table - Current Page';

    openPrintWindow({
      columns: visibleExportColumns,
      rows: printableRows,
      title: printTitle,
    });
  }

  function exportPdfView() {
    printRows('all');
  }

  function moveColumn(columnId, direction) {
    setColumnOrder((currentOrder) => {
      const normalizedOrder = normalizeColumnOrder(currentOrder);
      const movableColumnIds = normalizedOrder.filter((id) => id !== 'select');
      const columnIndex = movableColumnIds.indexOf(columnId);
      const nextIndex = columnIndex + direction;

      if (columnIndex === -1 || nextIndex < 0 || nextIndex >= movableColumnIds.length) {
        return normalizedOrder;
      }

      const nextOrder = [...movableColumnIds];
      [nextOrder[columnIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[columnIndex]];

      return ['select', ...nextOrder];
    });
  }

  function updateColumnWidth(columnId, width) {
    const numericWidth = Number(width);

    if (!Number.isFinite(numericWidth)) {
      return;
    }

    setColumnSizing((currentSizing) => ({
      ...currentSizing,
      [columnId]: Math.max(80, numericWidth),
    }));
  }

  function resetColumnSettings() {
    setColumnOrder(defaultColumnOrder);
    setColumnSizing(defaultColumnSizing);
    setColumnVisibility({});
  }

  function addPresentationRule() {
    const fallbackField = orderedDataColumnIds[0] ?? baseColumns[0]?.accessorKey ?? 'status';

    setPresentationRules((currentRules) => [
      ...currentRules,
      createPresentationRule({
        field: fallbackField,
      }),
    ]);
  }

  function updatePresentationRule(ruleId, patch) {
    setPresentationRules((currentRules) =>
      normalizePresentationRules(
        currentRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
      ),
    );
  }

  function deletePresentationRule(ruleId) {
    setPresentationRules((currentRules) => currentRules.filter((rule) => rule.id !== ruleId));
  }

  function reorderPresentationRules(activeRuleId, overRuleId) {
    setPresentationRules((currentRules) => reorderItems(currentRules, activeRuleId, overRuleId));
  }

  function resetPresentationRules() {
    setPresentationRules(cloneDefaultPresentationRules());
  }

  function getColumnLabel(column) {
    return typeof column?.columnDef.header === 'string' ? column.columnDef.header : column?.id;
  }

  function clampContextMenuPosition(event) {
    const menuWidth = 248;
    const menuHeight = 360;
    const x = Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12));
    const y = Math.max(12, Math.min(event.clientY, window.innerHeight - menuHeight - 12));

    return {
      submenuPlacement: x > window.innerWidth - menuWidth * 2 - 24 ? 'left' : 'right',
      x,
      y,
    };
  }

  function openHeaderContextMenu(event, header) {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event);

    setContextMenu({
      ...position,
      columnId: header.column.id,
      label: `Column: ${getColumnLabel(header.column)}`,
      target: 'header',
    });
  }

  function openCellContextMenu(event, cell, row) {
    event.preventDefault();
    event.stopPropagation();

    const position = clampContextMenuPosition(event);

    setContextMenu({
      ...position,
      cellId: cell.id,
      columnId: cell.column.id,
      label: `${row.original.id} · ${getColumnLabel(cell.column)}`,
      rowId: row.id,
      target: 'cell',
      value: getCellValue(row, cell.column.id),
    });
  }

  function fitColumnWidth(columnId) {
    if (columnId === 'select') {
      updateColumnWidth(columnId, defaultColumnSizing.select);
      return;
    }

    const column = table.getColumn(columnId);
    const headerText = getColumnLabel(column) ?? columnId;
    const longestTextLength = tableData.reduce(
      (length, row) => Math.max(length, String(row[columnId] ?? '').length),
      String(headerText).length,
    );
    const measuredWidth = Math.min(300, Math.max(96, longestTextLength * 9 + 48));

    updateColumnWidth(columnId, measuredWidth);
  }

  function fitAllColumnWidths() {
    defaultColumnOrder.forEach((columnId) => fitColumnWidth(columnId));
  }

  function selectContextRow(rowId, replaceSelection = selectionMode === 'single') {
    if (replaceSelection) {
      setRowSelection({ [rowId]: true });
      return;
    }

    setRowSelection((currentSelection) => ({
      ...currentSelection,
      [rowId]: true,
    }));
  }

  function toggleContextRow(rowId) {
    setRowSelection((currentSelection) => {
      if (selectionMode === 'single') {
        return currentSelection[rowId] ? {} : { [rowId]: true };
      }

      const nextSelection = { ...currentSelection };

      if (nextSelection[rowId]) {
        delete nextSelection[rowId];
      } else {
        nextSelection[rowId] = true;
      }

      return nextSelection;
    });
  }

  function copyContextRow(row) {
    const content = visibleExportColumns.map((column) => buildCsvValue(row.original[column.id])).join(',');
    copyText(content);
  }

  function buildHeaderContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const canSort = column?.getCanSort();
    const sortDirection = column?.getIsSorted();
    const dataColumnIndex = orderedDataColumnIds.indexOf(menuState.columnId);
    const canMoveColumn = dataColumnIndex !== -1;

    return [
      {
        disabled: !canSort,
        key: 'sort-ascending',
        label: 'Sort ascending',
        meta: canSort && sortDirection === 'asc' ? 'Active' : '',
        onSelect: () => column?.toggleSorting(false),
      },
      {
        disabled: !canSort,
        key: 'sort-descending',
        label: 'Sort descending',
        meta: canSort && sortDirection === 'desc' ? 'Active' : '',
        onSelect: () => column?.toggleSorting(true),
      },
      {
        disabled: !sortDirection,
        key: 'clear-sort',
        label: 'Clear sort',
        onSelect: () => column?.clearSorting(),
      },
      { key: 'header-separator-1', separator: true },
      {
        disabled: !column?.getCanHide(),
        key: 'hide-column',
        label: 'Hide column',
        onSelect: () => column?.toggleVisibility(false),
      },
      {
        key: 'column-layout',
        label: 'Column layout',
        items: [
          {
            disabled: !canMoveColumn || dataColumnIndex === 0,
            key: 'move-left',
            label: 'Move left',
            onSelect: () => moveColumn(menuState.columnId, -1),
          },
          {
            disabled: !canMoveColumn || dataColumnIndex === orderedDataColumnIds.length - 1,
            key: 'move-right',
            label: 'Move right',
            onSelect: () => moveColumn(menuState.columnId, 1),
          },
          {
            key: 'fit-column',
            label: 'Auto fit this column',
            onSelect: () => fitColumnWidth(menuState.columnId),
          },
          {
            key: 'fit-all-columns',
            label: 'Auto fit all columns',
            onSelect: fitAllColumnWidths,
          },
          {
            key: 'reset-layout',
            label: 'Reset column layout',
            onSelect: resetColumnSettings,
          },
        ],
      },
      {
        key: 'open-column-settings',
        label: 'Open column settings',
        onSelect: () => setColumnsModalOpen(true),
      },
    ];
  }

  function buildCellContextMenuItems(menuState) {
    const column = table.getColumn(menuState.columnId);
    const row = visibleRows.find((visibleRow) => visibleRow.id === menuState.rowId);
    const canFilter = column?.getCanFilter();
    const isSelected = Boolean(rowSelection[menuState.rowId]);

    return [
      {
        key: 'copy-cell',
        label: 'Copy cell value',
        onSelect: () => copyText(menuState.value),
      },
      {
        disabled: !row,
        key: 'copy-row',
        label: 'Copy row values',
        onSelect: () => copyContextRow(row),
      },
      {
        disabled: !canFilter,
        key: 'filter-by-value',
        label: 'Filter by this value',
        onSelect: () => {
          updateColumnFilter(menuState.columnId, menuState.value);
          setShowFilters(true);
        },
      },
      {
        disabled: activeColumnFilters === 0 && !globalFilter,
        key: 'clear-all-filters',
        label: 'Clear all filters',
        onSelect: () => {
          clearColumnFilters();
          clearSearch();
        },
      },
      { key: 'cell-separator-1', separator: true },
      {
        key: 'row-actions',
        label: 'Row actions',
        items: [
          {
            disabled: !row,
            key: 'select-row',
            label: selectionMode === 'single' ? 'Select row' : 'Add row to selection',
            onSelect: () => selectContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'toggle-row-selection',
            label: isSelected ? 'Remove from selection' : 'Toggle row selection',
            onSelect: () => toggleContextRow(menuState.rowId),
          },
          {
            disabled: !row,
            key: 'activate-row',
            label: 'Set as active row',
            onSelect: () => setLastDoubleClickedRow(row.original),
          },
          {
            disabled: !row,
            key: 'print-this-row',
            label: 'Print this row',
            onSelect: () =>
              openPrintWindow({
                columns: visibleExportColumns,
                rows: [row],
                title: `TanStack Table - ${row.original.id}`,
              }),
          },
        ],
      },
      {
        key: 'paging-actions',
        label: 'Paging',
        items: [
          {
            disabled: !table.getCanPreviousPage(),
            key: 'first-page',
            label: 'First page',
            onSelect: () => table.setPageIndex(0),
          },
          {
            disabled: !table.getCanPreviousPage(),
            key: 'previous-page',
            label: 'Previous page',
            onSelect: () => table.previousPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'next-page',
            label: 'Next page',
            onSelect: () => table.nextPage(),
          },
          {
            disabled: !table.getCanNextPage(),
            key: 'last-page',
            label: 'Last page',
            onSelect: () => table.setPageIndex(Math.max(table.getPageCount() - 1, 0)),
          },
        ],
      },
    ];
  }

  function handleContextMenuSelect(item) {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
    setContextMenu(null);
  }

  const orderedDataColumnIds = normalizeColumnOrder(columnOrder).filter((columnId) => columnId !== 'select');
  const columnOptions = orderedDataColumnIds
    .map((columnId, index) => table.getColumn(columnId))
    .filter(Boolean)
    .map((column, index) => ({
      key: column.id,
      label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
      checked: column.getIsVisible(),
      canMoveDown: index < orderedDataColumnIds.length - 1,
      canMoveUp: index > 0,
      disabled: !column.getCanHide(),
      minWidth: 80,
      onChange: (checked) => column.toggleVisibility(checked),
      onMoveDown: () => moveColumn(column.id, 1),
      onMoveUp: () => moveColumn(column.id, -1),
      onWidthChange: (width) => updateColumnWidth(column.id, width),
      width: columnSizing[column.id] ?? column.getSize(),
    }));

  const summaryItems = [
    { label: 'Visible rows', value: visibleRows.length },
    { label: 'Matching rows', value: matchingRows.length },
    { label: 'Selected rows', value: selectedRows.length },
    { label: 'Selection callback', value: selectedRowsReport.length > 0 ? selectedRowsReport.join(', ') : 'none' },
    { label: 'Last double-click', value: lastDoubleClickedRow?.id ?? 'none' },
    { label: 'Search', value: globalFilter || 'none' },
    { label: 'Column filters', value: activeColumnFilters || 'none' },
    { label: 'Presentation rules', value: activePresentationRules || 'none' },
  ];

  const printMenuItems = [
    {
      key: 'current-page',
      label: 'Print current page',
      onClick: () => printRows('page'),
    },
    {
      key: 'all-filtered',
      label: 'Print all filtered rows',
      onClick: () => printRows('all'),
    },
    {
      key: 'selected',
      disabled: selectedRows.length === 0,
      label: 'Print selected rows',
      onClick: () => printRows('selected'),
    },
  ];

  const footerButtons = buildGridFooterButtons({
    filtering: showFilters,
    onColumnsSettings: () => setColumnsModalOpen(true),
    onExportExcel: exportFilteredRows,
    onExportPdf: exportPdfView,
    onPresentationSettings: () => setTemplateEditorOpen(true),
    onToggleFilter: () => setShowFilters((current) => !current),
    onToggleSummary: () => setShowSummary((current) => !current),
    footerButtons: [
      {
        component: <Tag color="blue">{selectedRows.length} selected</Tag>,
        isCustomComponent: true,
        key: 'selection-count',
      },
      {
        component: (
          <Dropdown menu={{ items: printMenuItems }} trigger={['click']}>
            <Button icon={<PrinterOutlined />}>Print</Button>
          </Dropdown>
        ),
        isCustomComponent: true,
        key: 'print',
      },
    ],
    showColumnsSettings: true,
    showExportExcel: true,
    showExportPdf: true,
    showFilter: true,
    showPresentationSettings: true,
    presentationSettingsActive: templateEditorOpen,
    showPrint: true,
    showSummary: true,
    summaryVisible: showSummary,
  });

  const contextMenuItems =
    contextMenu?.target === 'header'
      ? buildHeaderContextMenuItems(contextMenu)
      : contextMenu?.target === 'cell'
        ? buildCellContextMenuItems(contextMenu)
        : [];

  return (
    <div className="tanstack-grid">
      <div className="tanstack-grid__toolbar">
        <div className="tanstack-grid__controls">
          <label className="tanstack-grid__field">
            <span>Selection mode</span>
            <select onChange={(event) => setSelectionMode(event.target.value)} value={selectionMode}>
              <option value="multi">Multi-select</option>
              <option value="single">Single-select</option>
            </select>
          </label>

          <label className="tanstack-grid__field">
            <span>Page size</span>
            <select
              disabled={showAllRows}
              onChange={(event) =>
                setPagination((current) => ({
                  ...current,
                  pageIndex: 0,
                  pageSize: Number(event.target.value),
                }))
              }
              value={pagination.pageSize}
            >
              {[3, 5, 8].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} rows
                </option>
              ))}
            </select>
          </label>

          <label className="tanstack-grid__toggle">
            <input
              checked={showAllRows}
              onChange={(event) => setShowAllRows(event.target.checked)}
              type="checkbox"
            />
            <span>Show all filtered rows</span>
          </label>
        </div>
      </div>

      <div className="tanstack-grid__surface">
        {showFilters ? (
          <div className="tanstack-grid__inline-panel">
            <div className="tanstack-grid__filters">
              {table
                .getAllLeafColumns()
                .filter((column) => column.id !== 'select')
                .map((column) => {
                  const filterVariant = column.columnDef.meta?.filterVariant ?? 'text';
                  const filterValue = column.getFilterValue() ?? '';
                  const label =
                    typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;

                  return (
                    <label className="tanstack-grid__field" key={column.id}>
                      <span>{label}</span>
                      {filterVariant === 'select' ? (
                        <select
                          onChange={(event) => updateColumnFilter(column.id, event.target.value)}
                          value={filterValue}
                        >
                          <option value="">All</option>
                          {column.columnDef.meta?.filterOptions?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          onChange={(event) => updateColumnFilter(column.id, event.target.value)}
                          placeholder={`Filter ${label.toLowerCase()}`}
                          type="text"
                          value={filterValue}
                        />
                      )}
                    </label>
                  );
                })}

              <div className="tanstack-grid__filter-actions">
                <span className="tanstack-grid__filter-count">
                  {activeColumnFilters} active filter{activeColumnFilters === 1 ? '' : 's'}
                </span>
                <button className="tanstack-grid__button" onClick={clearColumnFilters} type="button">
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showSummary ? (
          <>
            <GridSummaryBar items={summaryItems} />
            <div className="tanstack-grid__aggregation-bar">
              <div className="tanstack-grid__aggregation-controls">
                <span>Revenue aggregates</span>
                <select
                  aria-label="Aggregation scope"
                  onChange={(event) => setAggregationScope(event.target.value)}
                  value={aggregationScope}
                >
                  <option value="page">Current page</option>
                  <option value="filtered">All filtered rows</option>
                </select>
              </div>

              <div className="tanstack-grid__aggregation-items">
                {revenueAggregates.map((item) => (
                  <span className="tanstack-grid__aggregation-item" key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div className="tanstack-grid__table-wrap">
          <table className="tanstack-grid__table" style={{ width: table.getTotalSize() }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    const headerPresentationRule = getMatchingPresentationRule(presentationRules, {
                      columnId: header.column.id,
                      target: 'header',
                    });

                    return (
                      <th
                        className={getPresentationClassName('header', headerPresentationRule)}
                        key={header.id}
                        onContextMenu={(event) => openHeaderContextMenu(event, header)}
                        style={{ width: header.getSize(), ...getPresentationStyle(headerPresentationRule) }}
                        title={getPresentationTooltip(headerPresentationRule)}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            className="tanstack-grid__header-button"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            <span className="tanstack-grid__sort-indicator">
                              {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
                            </span>
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {visibleRows.length > 0 ? (
                visibleRows.map((row) => {
                  const rowPresentationRule = getMatchingPresentationRule(presentationRules, {
                    row,
                    target: 'row',
                  });

                  return (
                    <tr
                      className={[
                        row.getIsSelected() ? 'tanstack-grid__row--selected' : '',
                        lastDoubleClickedRow?.id === row.original.id ? 'tanstack-grid__row--active' : '',
                        getPresentationClassName('row', rowPresentationRule),
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      key={row.id}
                      onDoubleClick={() => setLastDoubleClickedRow(row.original)}
                      title={getPresentationTooltip(rowPresentationRule)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const cellPresentationRule = getMatchingPresentationRule(presentationRules, {
                          columnId: cell.column.id,
                          row,
                          target: 'cell',
                        });
                        const rawCellValue = getCellValue(row, cell.column.id);
                        const renderedCellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

                        return (
                          <td
                            className={getPresentationClassName('cell', cellPresentationRule)}
                            key={cell.id}
                            onContextMenu={(event) => openCellContextMenu(event, cell, row)}
                            style={{
                              width: cell.column.getSize(),
                              ...getPresentationStyle(rowPresentationRule),
                              ...getPresentationStyle(cellPresentationRule),
                            }}
                            title={getPresentationTooltip(cellPresentationRule) ?? getPresentationTooltip(rowPresentationRule)}
                          >
                            <div className="tanstack-grid__cell-content">
                              {renderPresentationCellContent(
                                renderedCellContent,
                                cellPresentationRule,
                                rawCellValue,
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="tanstack-grid__empty-cell" colSpan={table.getVisibleLeafColumns().length}>
                    <Empty description="No rows match the current search and filters." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <GridFooter
          attached
          buttons={footerButtons}
          currentPage={table.getState().pagination.pageIndex + 1}
          disablePaging={showAllRows}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          onNextPage={() => table.nextPage()}
          onPageSizeChange={(nextPageSize) =>
            setPagination((current) => ({
              ...current,
              pageIndex: 0,
              pageSize: nextPageSize,
            }))
          }
          onPreviousPage={() => table.previousPage()}
          pageSize={pagination.pageSize}
          pageSizeOptions={[3, 5, 8]}
          searchProps={{
            inputValue: globalFilterDraft,
            onInputChange: setGlobalFilterDraft,
            onSearch: applySearch,
            onClear: clearSearch,
            isSearching: false,
            placeholder: 'Search',
          }}
          total={matchingRows.length}
          totalPages={Math.max(table.getPageCount(), 1)}
        />
      </div>

      <GridColumnsModal
        columns={columnOptions}
        description="Choose visibility, order, and fixed widths for the TanStack columns. Settings persist in local storage for this preview."
        onClose={() => setColumnsModalOpen(false)}
        onReset={resetColumnSettings}
        open={columnsModalOpen}
      />

      <GridTemplateEditorModal
        columns={columnOptions}
        onAddRule={addPresentationRule}
        onClose={() => setTemplateEditorOpen(false)}
        onDeleteRule={deletePresentationRule}
        onReorderRules={reorderPresentationRules}
        onReset={resetPresentationRules}
        onUpdateRule={updatePresentationRule}
        open={templateEditorOpen}
        rules={presentationRules}
      />

      <ContextMenu
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
        onSelect={handleContextMenuSelect}
        state={contextMenu}
      />
    </div>
  );
}
